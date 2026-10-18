# noxvault/detection/ml/feature_extractor.py

from typing import List, Dict, Any
from core.models import Event
import math


class FeatureExtractor:
    """
    Converts raw NOXVAULT events into ML-ready numerical feature vectors.
    This module is used by:
    - anomaly_model.py
    - detection_pipeline.py
    """

    # ---------------------------------------------------------
    # MAIN ENTRY POINT
    # ---------------------------------------------------------
    def extract(self, event: Event) -> List[float]:
        """
        Extracts a normalized feature vector from an event.
        """

        data = event.data

        return [
            self._norm(data.get("cpu", 0), 0, 100),
            self._norm(data.get("memory", 0), 0, 32768),  # MB
            self._norm(data.get("bytes_out", 0), 0, 10_000_000),
            self._norm(data.get("bytes_in", 0), 0, 10_000_000),
            self._norm(data.get("connections_last_min", 0), 0, 500),
            self._norm(data.get("files_modified_last_min", 0), 0, 500),
            self._norm(data.get("files_deleted_last_min", 0), 0, 500),
            self._norm(data.get("runtime", 0), 0, 3600),  # seconds
            self._encode_category(event.category),
            self._encode_boolean(data.get("suspicious", False)),
        ]

    # ---------------------------------------------------------
    # NORMALIZATION HELPERS
    # ---------------------------------------------------------
    def _norm(self, value: Any, min_val: float, max_val: float) -> float:
        """
        Normalize numeric values to 0–1 range.
        """
        try:
            v = float(value)
        except:
            return 0.0

        if v < min_val:
            return 0.0
        if v > max_val:
            return 1.0

        return (v - min_val) / (max_val - min_val)

    # ---------------------------------------------------------
    # CATEGORY ENCODING
    # ---------------------------------------------------------
    def _encode_category(self, category: str) -> float:
        """
        Encode event categories into numeric values.
        """
        mapping = {
            "process": 0.1,
            "network": 0.2,
            "auth": 0.3,
            "file": 0.4,
            "cloud": 0.5,
            "firewall": 0.6,
        }
        return mapping.get(category, 0.0)

    # ---------------------------------------------------------
    # BOOLEAN ENCODING
    # ---------------------------------------------------------
    def _encode_boolean(self, value: Any) -> float:
        return 1.0 if value else 0.0
