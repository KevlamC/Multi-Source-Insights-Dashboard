import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple, Optional, Any


def build_feature_csv(
        ids: List[str],
        feature_page: str,
        source_csv_path: str,
        output_dir: str
) -> Tuple[str, int]:
    """
    Build and write a page-specific CSV from a master comments CSV.

    Takes a list of comment IDs and creates a new CSV with only those comments,
    formatted according to the specified feature page's display schema.

    Args:
        ids: List of comment IDs to include in the output
        feature_page: Name of the feature page (case-insensitive)
        source_csv_path: Path to the source CSV file
        output_dir: Directory to write the output CSV

    Returns:
        Tuple of (full_output_path, number_of_rows_written)

    Raises:
        ValueError: If feature_page is not recognized
        FileNotFoundError: If source CSV doesn't exist
    """

    # Define page schemas with exact column order and mappings
    PAGE_SCHEMAS = {
        'pain-pinots page': {
            'slug': 'pain-pinots-page',
            'columns': ['author', 'timestamp', 'subreddit', 'comment', 'upvotes',
                        'emotions', 'post', 'confidence', 'painpoints'],
            'mapping': {
                'author': 'author',
                'timestamp': 'created_utc',  # Convert to ISO-8601
                'subreddit': 'subreddit',
                'comment': 'body',
                'upvotes': 'score',
                'emotions': 'emotions',
                'post': 'post_id',
                'confidence': 'sentiment_score',
                'painpoints': 'painpointsxfrustrations'
            }
        },
        'failed solutions': {
            'slug': 'failed-solutions',
            'columns': ['comment', 'failed solution', 'frustration phase', 'emotional intensity',
                        'emotion', 'topic', 'likes/upvotes'],
            'mapping': {
                'comment': 'body',
                'failed solution': 'failed_solutions',
                'frustration phase': 'painpointsxfrustrations',
                'emotional intensity': 'sentiment_score',
                'emotion': 'emotions',
                'topic': 'topics',
                'likes/upvotes': 'score'
            }
        },
        'desired outcomes': {
            'slug': 'desired-outcomes',
            'columns': ['author', 'subreddit', 'text', 'upvotes', 'post',
                        'desire/wish', 'sentiment/intensity', 'summary'],
            'mapping': {
                'author': 'author',
                'subreddit': 'subreddit',
                'text': 'body',
                'upvotes': 'score',
                'post': 'post_id',
                'desire/wish': 'desire_and_wish',
                'sentiment/intensity': 'sentiment_score',
                'summary': None  # No source column; fill with None
            }
        },
        'metaphors': {
            'slug': 'metaphors',
            'columns': ['metaphor', 'emotion', 'timestamp', 'comment', 'redditor'],
            'mapping': {
                'metaphor': 'metaphors',
                'emotion': 'emotions',
                'timestamp': 'created_utc',  # Convert to ISO-8601
                'comment': 'body',
                'redditor': 'author'
            }
        },
        'practiotner': {  # Preserving intentional misspelling
            'slug': 'practiotner',
            'columns': ['author', 'subreddit', 'comment', 'votes', 'emotion',
                        'time', 'category', 'confidence', 'marketing value'],
            'mapping': {
                'author': 'author',
                'subreddit': 'subreddit',
                'comment': 'body',
                'votes': 'score',
                'emotion': 'emotions',
                'time': 'created_utc',  # Convert to ISO-8601
                'category': 'practitioner_reference',
                'confidence': 'sentiment_score',
                'marketing value': None  # No source column; fill with None
            }
        },
        'triggers': {
            'slug': 'triggers',
            'columns': ['author', 'timestamp', 'subreddit', 'comment', 'trigger phase'],
            'mapping': {
                'author': 'author',
                'timestamp': 'created_utc',  # Convert to ISO-8601
                'subreddit': 'subreddit',
                'comment': 'body',
                'trigger phase': 'trigger_phrase'
            }
        },
        'questions page': {
            'slug': 'RedditQuestions',
            'columns': ['author', 'timestamp', 'subreddit', 'text', 'upvotes',
                        'post', 'topic', 'sentiment intensity', 'summary'],
            'mapping': {
                'author': 'author',
                'timestamp': 'created_utc',  # Convert to ISO-8601
                'subreddit': 'subreddit',
                'text': 'question',  # Special case: coalesce(question, body)
                'upvotes': 'score',
                'post': 'post_id',
                'topic': 'topics',
                'sentiment intensity': 'sentiment_score',
                'summary': None  # No source column; fill with None
            }
        }
    }

    # Normalize and validate feature_page
    feature_page_lower = feature_page.lower()
    schema = None
    for page_key, page_schema in PAGE_SCHEMAS.items():
        if page_key.lower() == feature_page_lower:
            schema = page_schema
            break

    if schema is None:
        valid_pages = list(PAGE_SCHEMAS.keys())
        raise ValueError(f"Unrecognized feature_page '{feature_page}'. Valid options: {valid_pages}")

    # Validate inputs
    if not Path(source_csv_path).exists():
        raise FileNotFoundError(f"Source CSV not found: {source_csv_path}")

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Handle empty ids case
    if not ids:
        # Create empty CSV with just headers
        empty_df = pd.DataFrame(columns=schema['columns'])
        timestamp_str = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        filename = f"{schema['slug']}__{timestamp_str}.csv"
        output_path = Path(output_dir) / filename
        empty_df.to_csv(output_path, index=False, encoding='utf-8', lineterminator='\n')
        return str(output_path), 0

    # Read source CSV
    try:
        df_source = pd.read_csv(source_csv_path)
    except Exception as e:
        raise RuntimeError(f"Failed to read source CSV: {e}")

    # Ensure 'id' column exists
    if 'id' not in df_source.columns:
        raise ValueError("Source CSV must contain 'id' column")

    # Handle duplicate IDs: keep earliest by created_utc
    # First, ensure created_utc is numeric for sorting (treat non-numeric as +inf)
    df_source['_sort_utc'] = pd.to_numeric(df_source.get('created_utc', pd.Series()), errors='coerce')
    df_source['_sort_utc'] = df_source['_sort_utc'].fillna(float('inf'))

    # Sort by id and created_utc, then drop duplicates keeping first
    df_source = df_source.sort_values(['id', '_sort_utc']).drop_duplicates(subset=['id'], keep='first')
    df_source = df_source.drop('_sort_utc', axis=1)

    # Filter to only requested IDs and preserve order
    # Create a mapping of id to row for efficient lookup
    id_to_row = {str(row['id']): row for _, row in df_source.iterrows()}

    # Build output rows in the order of input ids
    output_rows = []
    for comment_id in ids:
        if str(comment_id) in id_to_row:
            output_rows.append(id_to_row[str(comment_id)])

    if not output_rows:
        # No matching IDs found, create empty CSV with headers
        empty_df = pd.DataFrame(columns=schema['columns'])
        timestamp_str = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        filename = f"{schema['slug']}__{timestamp_str}.csv"
        output_path = Path(output_dir) / filename
        empty_df.to_csv(output_path, index=False, encoding='utf-8', lineterminator='\n')
        return str(output_path), 0

    # Create DataFrame from filtered rows
    df_filtered = pd.DataFrame(output_rows)

    # Apply schema mapping to create output DataFrame
    output_data = {}

    for output_col in schema['columns']:
        source_col = schema['mapping'].get(output_col)

        if source_col is None:
            # No source column; fill with None
            output_data[output_col] = [None] * len(df_filtered)
        elif source_col in df_filtered.columns:
            values = df_filtered[source_col].copy()

            # Handle special cases
            if output_col in ['timestamp', 'time'] and source_col == 'created_utc':
                # Convert epoch seconds to ISO-8601 UTC
                values = values.apply(_convert_epoch_to_iso)
            elif output_col == 'text' and source_col == 'question':
                # Special case for questions page: coalesce(question, body)
                body_values = df_filtered.get('body', pd.Series([None] * len(df_filtered)))
                values = values.combine_first(body_values)

            output_data[output_col] = values.tolist()
        else:
            # Source column doesn't exist; fill with None
            output_data[output_col] = [None] * len(df_filtered)

    # Create output DataFrame with exact column order
    df_output = pd.DataFrame(output_data, columns=schema['columns'])

    # Generate output filename with current timestamp
    timestamp_str = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    filename = f"{schema['slug']}__{timestamp_str}.csv"
    output_path = Path(output_dir) / filename

    # Write CSV with specified format
    df_output.to_csv(output_path, index=False, encoding='utf-8', lineterminator='\n')

    return str(output_path), len(df_output)


def _convert_epoch_to_iso(epoch_value: Any) -> Optional[str]:
    """
    Convert epoch seconds (int/str) to UTC ISO-8601 string.

    Args:
        epoch_value: Epoch timestamp as int, str, or other

    Returns:
        ISO-8601 UTC string with Z suffix, or None if conversion fails
    """
    try:
        # Handle various input types
        if pd.isna(epoch_value) or epoch_value == '' or epoch_value is None:
            return None

        # Convert to float first to handle string numbers
        epoch_float = float(epoch_value)

        # Create datetime object from epoch
        dt = datetime.fromtimestamp(epoch_float, tz=timezone.utc)

        # Format as ISO-8601 with Z suffix
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    except (ValueError, TypeError, OSError):
        # Return None for any conversion failures
        return None


# Example usage (not executed)
if __name__ == "__main__":
    # Example usage:
    out_path, n = build_feature_csv(
        ids=["abc123", "def456"],
        feature_page="questions page",
        source_csv_path="data/master_comments.csv",
        output_dir="out"
    )
    print(out_path, n)

# Pytest-style test snippets (pseudo-code for testing requirements)
"""
def test_id_order_preservation():
    # Test that output rows follow input ids order
    ids = ["id3", "id1", "id2"]
    # Source has rows in order: id1, id2, id3
    # Output should have rows in order: id3, id1, id2
    pass

def test_questions_page_text_fallback():
    # Test that text field uses question if available, otherwise body
    # Source: question="What is this?", body="Some text"
    # Expected: text="What is this?"
    # Source: question=None, body="Some text"  
    # Expected: text="Some text"
    pass

def test_timestamp_formatting():
    # Test epoch to ISO-8601 conversion
    # Source: created_utc=1692547323
    # Expected: timestamp="2023-08-20T15:42:03Z"
    # Source: created_utc="invalid"
    # Expected: timestamp=None
    pass

def test_none_filling_missing_columns():
    # Test that missing source columns result in None values
    # If source CSV lacks 'summary' column for desired-outcomes page
    # Expected: summary column filled with None values
    pass

def test_duplicate_id_handling():
    # Test that duplicate IDs keep earliest by created_utc
    # Source has id="dup1" with created_utc=[1000, 2000]
    # Expected: keep row with created_utc=1000
    pass
"""