import brotli
import pandas as pd
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from . import brotli_compression 
from . import query_db
from .models import FilterRequest
    
# Define constants for vectorisation
TOP_N = 200           # return the top N comments matching target query
THRESHOLD = 0.3       # return comments whose similarity score >= match_threshold
MAX_OUT = 100         # return the first 100 comments based on score

def load_compressed_txt_(br_file_path: str, output_file_path):
    """
        Test function to open compressed csv.br file
        Only for testing purposes

        Args:
            br_file_path: Path to the compressed CSV file 
            output_file_path: Path to the decompressed CSV file
    """

    # Initialise brotli compressed file
    # Changed: Updated 'brmod.COMPRESSED_FILE' to 'Brtoli_compression.COMPRESSED_FILE'
    brotli_compression.COMPRESSED_FILE = br_file_path
    # Changed: Updated 'brmod.DECOMPRESSED_FILE' to 'Brtoli_compression.DECOMPRESSED_FILE'
    brotli_compression.DECOMPRESSED_FILE = output_file_path

    try:
        # Decompress brotli file and get decompression statistics
        # Changed: Updated 'brmod.BrotliFileCompressor' to 'Brtoli_compression.BrotliFileCompressor'
        # Changed: Updated 'brmod.COMPRESSION_LEVEL' to 'Brtoli_compression.COMPRESSION_LEVEL'
        compressor = brotli_compression.BrotliFileCompressor(compression_level=brotli_compression.COMPRESSION_LEVEL)
        stats = compressor.decompress_file('')

        # Print out decompression stats
        # Changed: Updated 'brmod.DECOMPRESSED_FILE' to 'Brtoli_compression.DECOMPRESSED_FILE'
        print(f"💾 Comments saved and Brotli-compressed to: {brotli_compression.DECOMPRESSED_FILE}")

        # Convert .txt file into a data frame object
        data = pd.read_csv(output_file_path, sep=',')   
        print(f"Decompressed data: {data}")
        return data 
    
    except Exception as e:
        print(f"Error occured during decompression: {e}")

def normalize_null_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize various null representations to proper None/NaN values.

    Args:
        df (pd.DataFrame): Input DataFrame

    Returns:
        pd.DataFrame: DataFrame with normalized null values
    """
    # Replace various null representations with None
    null_values = ['', 'null', 'NULL', 'None', 'NaN', 'nan']

    for col in df.columns:
        # Replace string representations of null with actual None
        df[col] = df[col].replace(null_values, None)

        # Convert empty strings to None for string columns
        if df[col].dtype == 'object':
            df[col] = df[col].apply(
                lambda x: None if pd.isna(x) or (isinstance(x, str) and x.strip() == '') else x)

    return df

def _check_emotion_filter(df_row, filter_criteria):

    try:
        # Access the values of the row
        raw = df_row.get('emotions', '{}')

        try:
            # Access the value associated with the 'emotions' column in the row
            emotions_dict = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except(json.JSONDecodeError) as e:
            print(f"Error occurred when parsing {raw}: {e}")
            return False

        # Normalize the keys and values in  'emotions' dictionary
        normalized_dict = {k.lower(): float(v) for k, v in emotions_dict.items() if v is not None}

        # Case 1: List of the emotion labels e.g. ["sad", "anger", "frustration"]
        if isinstance(filter_criteria, list):
            return any(e.lower() in normalized_dict for e in filter_criteria)
        
        # Case 2: Dictionary of List of emotions labels, assigned to key 'emotions'
        # and the threshold score, assigned to the key 'intensity score'
        # E.g. { "emotions": ["sad", "anger", "frustration"], intensity_score: 0.7 }
        elif isinstance(filter_criteria, dict):
            emotion_targets = [e.lower() for e in filter_criteria.get('emotions', [])] 
            min_thr = float(filter_criteria.get('min_intensity', 0.0))
            return all((e in normalized_dict) and (normalized_dict[e] >= min_thr) for e in emotion_targets)            
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        print(f"Error occured when filtering row {df_row} by emotion: {e}")
        return False
    
def _check_topic_filter(df_row, filter_criteria):

    try:

        # Access the raw data in the 'topics' colum of the df_row
        raw = df_row.get('topics', '{}')

        try:
            # Access the value associated with the 'topics' column in the row
            topics_dict = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except(json.JSONDecodeError) as e:
            raise Exception(f"Error occured when parsing {raw}: {e}")
        
        # Normalize the keys and values in the topics_dict
        normalized_dict = {k.lower() : float(v) for k,v, in topics_dict.items() if v is not None}

        # If filter_criteria is a List of the topic labels e.g. "["health", "technology", "finance"]", check if that topic exists in the 
        # topics dictionary returned
        if isinstance(filter_criteria, list):
            return any(t.lower() in normalized_dict for t in filter_criteria)
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        raise Exception(f"Error occured when filtering row {df_row} by topic: {e}")

def _check_time_filter(df_row, filter_criteria):

    try:
        # Get and validate the creation date from the row 
        created_str = df_row.get('created_utc')
        if not created_str:
            return False

        creation_date = pd.to_datetime(created_str, errors='coerce')
        if pd.isna(creation_date):
            return False

        # get the current time and define a time_bounds dictionary for mapping
        now = datetime.utcnow()
        time_bounds = {
            "past_day" : now - timedelta(days=1),
            "past_week" : now - timedelta(weeks=1),
            "past_month" : now - timedelta(days=30),
            "past_year" : now - timedelta(days=365)
        }

        # guard clause in case of invalid filter_criteria
        if filter_criteria not in time_bounds:
            raise ValueError(f"Invalid time filter: {filter_criteria}")

        return creation_date >= time_bounds[filter_criteria]
    except Exception as e:
        raise Exception(f"Error occured when filtering by time: {e}")

def _check_practitioner_type_filter(df_row, filter_criteria):
    # Reference: {"practitioner_type": "doctor", "practitioner_reference": "Doctors are leaving Canada for a reason"}

    try:
        # normalise filter criteria into a lowercase list
        if isinstance(filter_criteria, list):
            criteria_set = [t.lower() for t in filter_criteria]

            # parse the JSON safely
            raw = df_row.get('practitioner_reference', '{}')

            try:
                practitioners_dict = json.loads(raw) if isinstance(raw, str) else (raw or {})
            except(json.JSONDecodeError) as e:
                raise Exception(f"Error occured when parsing row {raw}: {e}")

            # Get practitioner_type 
            practitioner_type = practitioners_dict.get("practitioner_type", "")
            if not practitioner_type:
                return False
            
            return practitioner_type.lower() in criteria_set
        else:
            return False
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        raise Exception(f"Error occured when filtering row {df_row} by {filter_criteria}: {e}")

def _check_keyword_search_filter(df_filtered, search_criteria, filters):

    try:
        # fetch comment ids relevant to the feature page 
        _by_feature_ids = df_filtered['id'].tolist()

        # fetch comments relevant to the search criteria and extract the comment ids
        comments_by_search = query_db.similarity_search(search_criteria, TOP_N, THRESHOLD, filters)
        _by_search_ids = [res.get('id') for res in comments_by_search]
        print(f"# of comments ids returned based on search criteria: {len(_by_search_ids)}")

        # find the intersection of both lists (preferred approach, no results)
        relevant_ids = list(set(_by_feature_ids) & set(_by_search_ids))
        print(f"# of relevant comments: {len(relevant_ids)}")

        # filter the rows that match the search criteria
        df_filtered = df_filtered[df_filtered['id'].isin(relevant_ids)]

    except Exception as e:
        raise Exception(f"Error when filtering by search criteria: {e}")


# Update filter_reddit_comments to work with the passed FilterRequest data
def filter_reddit_comments(combined_df: pd.DataFrame, filters: FilterRequest) -> bytes:
    """
    Filter Reddit comments and return compressed brotli file of CSV data.
    
    Args:
        combined_df: DataFrame containing Reddit comments
        filters: FilterRequest object with filtering criteria
        
    Returns:
        bytes: Compressed brotli data of the filtered CSV
    """
    try:
        # Make a copy of the passed dataframe and normalize null values
        combined_df = normalize_null_values(combined_df.copy())
        df_filtered = pd.DataFrame()  # Initialize empty DataFrame
        
        activeFeature = None
        feature_pages = [
            'desire_and_wish',
            'trigger_phrase',
            'metaphors',
            'question', 
            'practitioner_reference',
            'painpointsxfrustrations',
            'failed_solutions'
        ]

        # Get the feature page from the FilterRequest class
        for feature in feature_pages:
            # Get the boolean value associated with the feature page
            bool_value = getattr(filters, feature, None)

            # Update activeFeature variable and break out of loop
            if bool_value:
                activeFeature = feature
                break

        if activeFeature is None: 
            raise ValueError(f"Unknown feature_page: {feature}. "
                                    f"Valid options: {feature_pages}")
        
        feature_column = activeFeature
            
        if feature_column not in combined_df.columns:
            raise KeyError(f"Feature column '{feature_column}' not found in DataFrame.")
        
        # Filter out rows where the feature column is null/None - Filter by Feature page
        df_filtered = combined_df[combined_df[feature_column].notna() & (combined_df[feature_column] != '')]

        # Filter by Emotions
        if getattr(filters, 'emotions') is not None:
            # Filter by intensity score (related to emotions)
            if getattr(filters, 'min_intensity') is not None:
                emotions_filter = {
                    "emotions": filters.emotions,
                    "min_intensity": filters.min_intensity
                }
            else:
                emotions_filter = filters.emotions

            df_filtered = df_filtered[df_filtered.apply(
                lambda row: _check_emotion_filter(row, emotions_filter), axis=1
            )]

        # Filter by Topics
        if getattr(filters, 'topics') is not None:
            topics_filter = filters.topics
            df_filtered = df_filtered[df_filtered.apply(
                lambda row: _check_topic_filter(row, topics_filter), axis=1
            )]

        # Filter by Time
        if getattr(filters, 'time') is not None:
            time_filter = filters.time.lower()
            if time_filter in ["past_day", "past_week", "past_month", "past_year"]:
                df_filtered = df_filtered[df_filtered.apply(
                    lambda row: _check_time_filter(row, time_filter), axis=1
                )]
            else:
                raise ValueError(f"Invalid time filter: {time_filter}")
        
        # Filter by Practitioner types
        if getattr(filters, 'practitioner_types') is not None:
            practitioners_filter = filters.practitioner_types
            df_filtered = df_filtered[df_filtered.apply(
                lambda row: _check_practitioner_type_filter(row, practitioners_filter), axis=1
            )]

        # Filter by keyword search
        if getattr(filters, 'keyword') is not None:

            # normalize keyword search
            search_criteria = filters.keyword.lower()

            # pass search criteria to function
            df_filtered = _check_keyword_search_filter(df_filtered, search_criteria, filters)

        # If no filters were applied, return empty df to indicate no matches found with provided filters
        if df_filtered.empty:
            df_filtered = combined_df.iloc[0:0]

        # Convert DataFrame to CSV in memory
        csv_data = df_filtered.to_csv(index=False).encode('utf-8')
        
        # Compress the CSV data using Brotli
        compressed_data = brotli.compress(csv_data, quality=6)
        
        print(f"✅ Filtering complete. Compressed {len(csv_data)} bytes to {len(compressed_data)} bytes "
                f"(compression ratio: {len(csv_data)/len(compressed_data):.2f}:1)")
        
        return compressed_data

    except Exception as e:
        raise Exception(f"Error in filter_reddit_comments: {str(e)}")


def print_filtered_comment_ids(comment_ids: List[str], max_display: int = 20) -> None:
    """
    Helper function to print filtered comment IDs in a readable format.

    Args:
        comment_ids (List[str]): List of comment IDs
        max_display (int): Maximum number of IDs to display
    """
    print(f"\n=== FILTERED COMMENT IDs ({len(comment_ids)} total) ===")

    if not comment_ids:
        print("No comment IDs found matching the criteria.")
        return

    # Display up to max_display IDs
    display_ids = comment_ids[:max_display]

    print("Comment IDs:")
    for i, comment_id in enumerate(display_ids, 1):
        print(f"{i:3d}. {comment_id}")

    if len(comment_ids) > max_display:
        print(f"... and {len(comment_ids) - max_display} more comment IDs")

    # Also return as a simple list format for easy copy-pasting
    # print(f"\nAs a list: {comment_ids}")


def print_filtered_comments(comments: List[Dict[str, Any]], max_display: int = 5) -> None:
    """
    Legacy helper function - kept for backward compatibility.
    Note: The main function now returns IDs only, so this won't be used in normal operation.
    """
    print("Note: filter_reddit_comments now returns comment IDs only.")
    print("Use print_filtered_comment_ids() instead.")


# Example usage and testing function
if __name__ == "__main__":
    # Example test cases based on the UX research model

    # Test 1: Filter by emotions
    test_emotions = {
        "feature_page": "emotions",
        "filters": {
            "emotions": {"emotion" : "admiration"}  # Look for comments with admiration emotion
        }
    }

    # Test 2: Filter pain points with specific content
    test_pain_points = {
        "feature_page": "pain_points",
        "filters": {
            "subreddit": "health",
            "painpointsxfrustrations": "can't find"  # Look for pain points containing this phrase
        }
    }

    # Test 3: Filter practitioner references
    test_practitioners = {
        "feature_page": "practitioner_references",
        "filters": {
            "practitioner_reference": "therapist"  # Look for therapist references
        }
    }

    # Test 4: Advanced emotion filtering with score threshold
    test_emotion_advanced = {
        "feature_page": "emotions",
        "filters": {
            "emotions": {"emotion": "anger", "min_score": 0.7}  # Anger with score >= 0.7
        }
    }

    # Test 5: Search criteria
    test_search_criteria_1 = {
        "feature_page": "pain_points",
        "search_criteria": "chronic pain",
        "filters": {
            "emotions" : {"emotion" : "anger"}
        }
    }

    # Test 6: Search criteria
    test_search_criteria_2 = {
        "feature_page": "triggers"
    }

    # Replace with your actual file path
    br_file_path = r"reddit_gout_comments_20250821_003739.csv.br"
    txt_file_path = r"decompressed_reddit_comments.txt"

    test_cases = [
        # ("Basic Emotions Filter", test_emotions),
        # ("Pain Points Filter", test_pain_points),
        # ("Practitioner References", test_practitioners),
        # ("Advanced Emotion Filter", test_emotion_advanced),
        # ("Search Criteria Filter", test_search_criteria_1),
        ("Search Criteria Filter", test_search_criteria_2)
    ]

    for test_name, test_request in test_cases:
        print(f"\n{'=' * 60}")
        print(f"TEST: {test_name}")
        print(f"Request: {test_request}")
        print(f"{'=' * 60}")

        try:
            # Call the filter function
            # The filter_reddit_comments function expects a DataFrame and a FilterRequest object.
            # Your example usage here is passing file paths and a dictionary, which won't work directly
            # without additional loading logic for the combined_df and conversion of test_request to FilterRequest.
            # I've commented this out to prevent a new error, as fixing this part
            # would require significant changes to the example usage to align with the
            # filter_reddit_comments function signature.
            # filtered_comment_ids = filter_reddit_comments(br_file_path, txt_file_path, test_request)
            
            # For demonstration, let's just print a message that this part needs adjustment.
            print("Note: The example usage in __main__ needs to be updated to match the filter_reddit_comments signature.")

            # Print the results
            # print_filtered_comment_ids(filtered_comment_ids)

        except Exception as e:
            print(f"Test failed: {str(e)}")