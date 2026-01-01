# /var/task/models.py
from typing import List, Optional
from pydantic import BaseModel

class FilterRequest(BaseModel):
    subreddits: Optional[List[str]] = None
    emotions: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    practitioner_types: Optional[List[str]] = None
    min_intensity: Optional[float] = None
    time: Optional[str] = None
    keyword: Optional[str] = None
    desire_and_wish: Optional[bool] = None
    trigger_phrase: Optional[bool] = None
    metaphors: Optional[bool] = None
    question: Optional[bool] = None
    practitioner_reference: Optional[bool] = None
    painpointsxfrustrations: Optional[bool] = None
    failed_solutions: Optional[bool] = None