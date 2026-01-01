# app.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Dict, Any
import os

# Import your glue function with relative import
from .glue_function import filter_then_build_csv
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ---- CONFIG: use environment variables for paths ----
SOURCE_CSV = os.getenv("SOURCE_CSV", "")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")

app = FastAPI()

# Allow Vite dev server and same-origin; adjust ports if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/filter-build-stream")
async def filter_build_stream(request: Request):
    """
    Expected JSON:
    {
      "feature_page": "questions page",     # for build_feature_csv schema
      "request_data": {                     # what your filter expects
        "feature_page": "questions",
        "filters": { ... },
        "search_criteria": "..."            # optional
      }
    }
    """
    try:
        payload = await request.json()
        feature_page = payload["feature_page"]
        request_data: Dict[str, Any] = payload["request_data"]

        out_path, rows = filter_then_build_csv(
            source_csv_path=SOURCE_CSV,
            request_data=request_data,
            feature_page=feature_page,      # e.g., "questions page"
            output_dir=OUTPUT_DIR,
        )

        p = Path(out_path)
        if not p.exists():
            raise HTTPException(status_code=500, detail="Output file not found after build")

        # Stream the file back (attachment)
        return FileResponse(
            path=str(p),
            media_type="text/csv",
            filename=p.name,
        )

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing key in payload: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
