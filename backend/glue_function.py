from typing import Tuple, Dict, Any
from .universal_filter_function import filter_reddit_comments
from .build_feature_csv import build_feature_csv

def filter_then_build_csv(
    source_csv_path: str,
    request_data: Dict[str, Any],
    feature_page: str,
    output_dir: str = "out"
) -> Tuple[str, int]:
    """
    1) Get filtered IDs via your universal filter
    2) Build a page-shaped CSV containing only those rows
    3) Return (output_path, rows_written)
    """
    # 1) Get the IDs (make sure your filter returns IDs, not bodies)
    ids = filter_reddit_comments(source_csv_path, request_data)

    # 2) Build the page-specific CSV
    out_path, n_rows = build_feature_csv(
        ids=ids,
        feature_page=feature_page,
        source_csv_path=source_csv_path,
        output_dir=output_dir,
    )

    return out_path, n_rows
