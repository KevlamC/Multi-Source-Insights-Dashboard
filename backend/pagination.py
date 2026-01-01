import os
import csv
import io
import brotli
import boto3
import logging
from pathlib import Path
from itertools import islice
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from typing import List, Dict, Any

# =========================
# ---- CONFIG SECTION -----
# =========================

SOURCE_CSV = os.getenv(
    "SOURCE_CSV",
    r"/backend/reddit_gout_comments_20250819_230108.csv.gz"
)

AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")
S3_BUCKET  = os.getenv("S3_BUCKET", "your-bucket-name")        # <-- set me
S3_PREFIX  = os.getenv("S3_PREFIX", "datasets")
PRESIGN_EXPIRE_SECONDS = int(os.getenv("PRESIGN_EXPIRE_SECONDS", "900"))  # 15 min

USE_BROTLI = True
BROTLI_QUALITY = 5

# NEW: max files to keep under pages/ (per dataset_id)
CAP_MAX_FILES = int(os.getenv("CAP_MAX_FILES", "5"))

assert PRESIGN_EXPIRE_SECONDS > 0

# =========================
# ---- APP & CLIENTS  -----
# =========================

app = FastAPI(title="Comment Pager → S3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("pager")

s3 = boto3.client("s3", region_name=AWS_REGION)

# Cache of known-existing objects
EXIST_CACHE: Dict[str, bool] = {}

# =========================
# ---- UTIL FUNCTIONS -----
# =========================

def is_gzip(path: str) -> bool:
    p = str(path).lower()
    return p.endswith(".gz") or p.endswith(".gzip")

def count_rows(csv_path: str) -> int:
    import gzip
    total = 0
    if is_gzip(csv_path):
        with gzip.open(csv_path, mode="rt", newline="") as f:
            reader = csv.reader(f)
            _ = next(reader, None)
            for _ in reader:
                total += 1
    else:
        with open(csv_path, mode="r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            _ = next(reader, None)
            for _ in reader:
                total += 1
    return total

def read_header(csv_path: str) -> list:
    import gzip
    if is_gzip(csv_path):
        with gzip.open(csv_path, mode="rt", newline="") as f:
            reader = csv.reader(f)
            return next(reader)
    else:
        with open(csv_path, mode="r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            return next(reader)

def stream_rows(csv_path: str, start_idx: int, end_idx: int):
    import gzip
    if is_gzip(csv_path):
        fh = gzip.open(csv_path, mode="rt", newline="")
    else:
        fh = open(csv_path, mode="r", newline="", encoding="utf-8")

    with fh as f:
        reader = csv.reader(f)
        _ = next(reader, None)  # skip header
        # skip until start_idx
        for _ in range(start_idx):
            next(reader, None)
        remaining = end_idx - start_idx
        for row in islice(reader, remaining):
            yield row

def make_s3_key(dataset_id: str, page: int, use_brotli: bool) -> str:
    ext = "csv.br" if use_brotli else "csv"
    return f"{S3_PREFIX}/{dataset_id}/pages/page-{page:06d}.{ext}"

def s3_object_exists(bucket: str, key: str) -> bool:
    if key in EXIST_CACHE:
        return True
    try:
        s3.head_object(Bucket=bucket, Key=key)
        EXIST_CACHE[key] = True
        return True
    except s3.exceptions.ClientError:
        return False

def upload_csv_slice_to_s3(
    csv_path: str,
    header: list,
    start_idx: int,
    end_idx: int,
    bucket: str,
    key: str,
    brotli_on: bool = True,
    brotli_quality: int = 5,
) -> None:
    raw_buf = io.StringIO()
    writer = csv.writer(raw_buf, lineterminator="\n")
    writer.writerow(header)
    for row in stream_rows(csv_path, start_idx, end_idx):
        writer.writerow(row)

    raw_bytes = raw_buf.getvalue().encode("utf-8")

    if brotli_on:
        compressed = brotli.compress(raw_bytes, quality=brotli_quality)
        body = io.BytesIO(compressed)
        extra_args = {"ContentType": "text/csv", "ContentEncoding": "br", "CacheControl": "public, max-age=300"}
    else:
        body = io.BytesIO(raw_bytes)
        extra_args = {"ContentType": "text/csv", "CacheControl": "public, max-age=300"}

    body.seek(0)
    s3.upload_fileobj(Fileobj=body, Bucket=bucket, Key=key, ExtraArgs=extra_args)
    EXIST_CACHE[key] = True

def presign(bucket: str, key: str, expires_in: int = PRESIGN_EXPIRE_SECONDS) -> str:
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in
    )

def pages_prefix(dataset_id: str) -> str:
    return f"{S3_PREFIX}/{dataset_id}/pages/"

# NEW: enforce a cap of N newest files under .../{dataset_id}/pages/
def enforce_object_cap(bucket: str, dataset_id: str, cap: int = CAP_MAX_FILES) -> int:
    """
    Keeps only the 'cap' most-recent objects by LastModified under
    {S3_PREFIX}/{dataset_id}/pages/. Deletes the oldest extras.
    Returns how many were deleted.
    """
    prefix = pages_prefix(dataset_id)
    paginator = s3.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix=prefix)

    objects: List[Dict[str, Any]] = []
    for p in pages:
        for obj in p.get("Contents", []):
            # skip "directory marker" keys if any
            if obj["Key"].endswith("/"):
                continue
            objects.append(obj)

    if len(objects) <= cap:
        return 0

    # Sort oldest → newest by LastModified
    objects.sort(key=lambda o: o["LastModified"])
    to_delete = objects[0: len(objects) - cap]

    # Batch delete (max 1000 per request is fine here)
    s3.delete_objects(
        Bucket=bucket,
        Delete={"Objects": [{"Key": o["Key"]} for o in to_delete], "Quiet": True}
    )

    # Purge from existence cache
    for o in to_delete:
        EXIST_CACHE.pop(o["Key"], None)

    return len(to_delete)

# =========================
# ---- RESPONSE MODELS ----
# =========================

class PageResponse(BaseModel):
    dataset_id: str
    page: int
    page_size: int
    total_rows: int
    total_pages: int
    key: str
    presigned_url: str

class CountResponse(BaseModel):
    dataset_id: str
    total_rows: int
    page_size: int
    total_pages: int

class TrimResponse(BaseModel):
    dataset_id: str
    kept: int
    deleted: int
    cap: int

# =========================
# ---- ROUTES -------------
# =========================

@app.get("/page_count", response_model=CountResponse)
def page_count(
    dataset_id: str = Query("default"),
    page_size: int = Query(10, ge=1, le=500),
):
    if not Path(SOURCE_CSV).exists():
        raise HTTPException(status_code=500, detail=f"SOURCE_CSV not found: {SOURCE_CSV}")

    total_rows = count_rows(SOURCE_CSV)
    total_pages = (total_rows + page_size - 1) // page_size
    return CountResponse(
        dataset_id=dataset_id,
        total_rows=total_rows,
        page_size=page_size,
        total_pages=total_pages
    )

@app.get("/page", response_model=PageResponse)
def get_page(
    dataset_id: str = Query("default"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=500),
):
    if not Path(SOURCE_CSV).exists():
        raise HTTPException(status_code=500, detail=f"SOURCE_CSV not found: {SOURCE_CSV}")

    total_rows = count_rows(SOURCE_CSV)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)

    if page > total_pages:
        raise HTTPException(status_code=404, detail=f"Page {page} out of range (1..{total_pages})")

    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_rows)

    key = make_s3_key(dataset_id, page, USE_BROTLI)

    uploaded_new = False
    if not s3_object_exists(S3_BUCKET, key):
        header = read_header(SOURCE_CSV)
        upload_csv_slice_to_s3(
            csv_path=SOURCE_CSV,
            header=header,
            start_idx=start_idx,
            end_idx=end_idx,
            bucket=S3_BUCKET,
            key=key,
            brotli_on=USE_BROTLI,
            brotli_quality=BROTLI_QUALITY,
        )
        uploaded_new = True

    # Only enforce cap when we actually added a new object
    if uploaded_new:
        deleted = enforce_object_cap(S3_BUCKET, dataset_id, cap=CAP_MAX_FILES)
        if deleted:
            log.info(f"Trimmed {deleted} old page objects under {pages_prefix(dataset_id)} (cap={CAP_MAX_FILES})")

    url = presign(S3_BUCKET, key, PRESIGN_EXPIRE_SECONDS)

    return PageResponse(
        dataset_id=dataset_id,
        page=page,
        page_size=page_size,
        total_rows=total_rows,
        total_pages=total_pages,
        key=key,
        presigned_url=url,
    )

# Optional: manual trim endpoint (e.g., cron or debugging)
@app.get("/trim_pages", response_model=TrimResponse)
def trim_pages(dataset_id: str = Query("default")):
    deleted = enforce_object_cap(S3_BUCKET, dataset_id, cap=CAP_MAX_FILES)

    # Recount what's left after trim
    prefix = pages_prefix(dataset_id)
    paginator = s3.get_paginator("list_objects_v2")
    count = 0
    for p in paginator.paginate(Bucket=S3_BUCKET, Prefix=prefix):
        count += len([obj for obj in p.get("Contents", []) if not obj["Key"].endswith("/")])

    return TrimResponse(dataset_id=dataset_id, kept=count, deleted=deleted, cap=CAP_MAX_FILES)
