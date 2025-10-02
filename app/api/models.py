from pydantic import BaseModel
from typing import Dict, List

class PredictionResponse(BaseModel):
    predictions: Dict[str, float]
    top_prediction: str
    confidence: float 