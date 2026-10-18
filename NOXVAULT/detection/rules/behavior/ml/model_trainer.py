# noxvault/detection/ml/model_trainer.py

import os
import json
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM

from detection.ml.feature_extractor import FeatureExtractor
from detection.ml.model_store import ModelStore


class ModelTrainer:
    """
    Offline ML training pipeline for NOXVAULT.
    Trains:
    - Isolation Forest
    - One-Class SVM
    """

    def __init__(self, dataset_path: str = "datasets/events.json"):
        self.dataset_path = dataset_path
        self.extractor = FeatureExtractor()
        self.model_store = ModelStore()

    # ---------------------------------------------------------
    # LOAD DATASET
    # ---------------------------------------------------------
    def load_dataset(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")

        with open(self.dataset_path, "r") as f:
            return json.load(f)

    # ---------------------------------------------------------
    # PREPARE TRAINING DATA
    # ---------------------------------------------------------
    def prepare_training_data(self, events: List[Dict[str, Any]]) -> np.ndarray:
        features = []

        for e in events:
            # Convert raw dict into Event-like structure
            fake_event = type("FakeEvent", (), {})()
            fake_event.data = e.get("data", {})
            fake_event.category = e.get("category", "unknown")

            features.append(self.extractor.extract(fake_event))

        return np.array(features)

    # ---------------------------------------------------------
    # TRAIN MODELS
    # ---------------------------------------------------------
    def train_models(self, X: np.ndarray):
        iso_forest = IsolationForest(
            n_estimators=150,
            contamination=0.02,
            random_state=42
        )
        iso_forest.fit(X)

        svm = OneClassSVM(
            kernel="rbf",
            gamma="scale",
            nu=0.05
        )
        svm.fit(X)

        return iso_forest, svm

    # ---------------------------------------------------------
    # SAVE MODELS
    # ---------------------------------------------------------
    def save_models(self, iso_forest, svm, training_size: int):
        self.model_store.save_model(
            "iso_forest",
            iso_forest,
            metadata={"training_size": training_size}
        )

        self.model_store.save_model(
            "one_class_svm",
            svm,
            metadata={"training_size": training_size}
        )

    # ---------------------------------------------------------
    # FULL TRAINING PIPELINE
    # ---------------------------------------------------------
    def run(self):
        print("[TRAINER] Loading dataset...")
        events = self.load_dataset()

        print(f"[TRAINER] Loaded {len(events)} events.")

        print("[TRAINER] Extracting features...")
        X = self.prepare_training_data(events)

        print(f"[TRAINER] Feature matrix shape: {X.shape}")

        print("[TRAINER] Training models...")
        iso_forest, svm = self.train_models(X)

        print("[TRAINER] Saving models...")
        self.save_models(iso_forest, svm, training_size=len(events))

        print("[TRAINER] Training complete.")
