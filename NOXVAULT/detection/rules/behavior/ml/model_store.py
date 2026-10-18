# noxvault/detection/ml/model_store.py

import os
import json
import joblib
from datetime import datetime
from typing import Any, Dict


class ModelStore:
    """
    Handles saving and loading ML models for NOXVAULT.
    Supports:
    - Isolation Forest
    - One-Class SVM
    - Autoencoders (future)
    """

    def __init__(self, base_path: str = "models/"):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    # ---------------------------------------------------------
    # SAVE MODEL
    # ---------------------------------------------------------
    def save_model(self, name: str, model: Any, metadata: Dict[str, Any] = None):
        model_path = os.path.join(self.base_path, f"{name}.joblib")
        meta_path = os.path.join(self.base_path, f"{name}.meta.json")

        # Save model
        joblib.dump(model, model_path)

        # Save metadata
        metadata = metadata or {}
        metadata.update({
            "model_name": name,
            "saved_at": datetime.utcnow().isoformat(),
        })

        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=4)

    # ---------------------------------------------------------
    # LOAD MODEL
    # ---------------------------------------------------------
    def load_model(self, name: str):
        model_path = os.path.join(self.base_path, f"{name}.joblib")
        meta_path = os.path.join(self.base_path, f"{name}.meta.json")

        if not os.path.exists(model_path):
            return None, None

        model = joblib.load(model_path)

        metadata = {}
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                metadata = json.load(f)

        return model, metadata

    # ---------------------------------------------------------
    # CHECK IF MODEL EXISTS
    # ---------------------------------------------------------
    def exists(self, name: str) -> bool:
        return os.path.exists(os.path.join(self.base_path, f"{name}.joblib"))

    # ---------------------------------------------------------
    # DELETE MODEL
    # ---------------------------------------------------------
    def delete_model(self, name: str) -> bool:
        model_path = os.path.join(self.base_path, f"{name}.joblib")
        meta_path = os.path.join(self.base_path, f"{name}.meta.json")

        deleted = False

        if os.path.exists(model_path):
            os.remove(model_path)
            deleted = True

        if os.path.exists(meta_path):
            os.remove(meta_path)

        return deleted
