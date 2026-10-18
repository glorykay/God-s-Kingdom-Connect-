# noxvault/detection/ml/anomaly_model.py

import uuid
import numpy as np
from datetime import datetime
from typing import List, Dict
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM

from core.models import Event, Alert
from detection.ml.feature_extractor import FeatureExtractor

self.extractor = FeatureExtractor()
features = self.extractor.extract(event)

# Save
store.save_model("iso_forest", self.iso_forest)

# Load
model, meta = store.load_model("iso_forest")



class AnomalyModel:
    """
    ML-based anomaly detection engine for NOXVAULT.
    Supports:
    - Isolation Forest
    - One-Class SVM
    - (Future) Autoencoder deep learning model
    """

    def __init__(self):
        # Isolation Forest (good for general anomalies)
        self.iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.02,
            random_state=42
        )

        # One-Class SVM (good for tight boundaries)
        self.oc_svm = OneClassSVM(
            kernel="rbf",
            gamma="scale",
            nu=0.05
        )

        # Storage for training data
        self.training_data: List[List[float]] = []
        self.is_trained = False

    # ---------------------------------------------------------
    # FEATURE EXTRACTION
    # ---------------------------------------------------------
    def extract_features(self, event: Event) -> List[float]:
        """
        Convert event into numerical ML features.
        This is a simplified version — you can expand it anytime.
        """

        data = event.data

        return [
            float(data.get("cpu", 0)),
            float(data.get("memory", 0)),
            float(data.get("bytes_out", 0)),
            float(data.get("bytes_in", 0)),
            float(data.get("connections_last_min", 0)),
            float(data.get("files_modified_last_min", 0)),
            float(data.get("files_deleted_last_min", 0)),
            float(data.get("runtime", 0)),
        ]

    # ---------------------------------------------------------
    # TRAINING
    # ---------------------------------------------------------
    def partial_fit(self, event: Event):
        """Incrementally build training dataset."""
        features = self.extract_features(event)
        self.training_data.append(features)

        # Train after enough samples
        if len(self.training_data) >= 200 and not self.is_trained:
            X = np.array(self.training_data)

            self.iso_forest.fit(X)
            self.oc_svm.fit(X)

            self.is_trained = True

    # ---------------------------------------------------------
    # SCORING
    # ---------------------------------------------------------
    def score_event(self, event: Event) -> Dict[str, float]:
        """
        Returns anomaly scores from both models.
        Higher = more anomalous.
        """

        features = np.array(self.extract_features(event)).reshape(1, -1)

        if not self.is_trained:
            return {"iso_score": 0.0, "svm_score": 0.0}

        iso_score = -self.iso_forest.score_samples(features)[0]
        svm_score = -self.oc_svm.score_samples(features)[0]

        return {
            "iso_score": float(iso_score),
            "svm_score": float(svm_score),
        }

    # ---------------------------------------------------------
    # DETECTION LOGIC
    # ---------------------------------------------------------
    def evaluate(self, event: Event) -> List[Alert]:
        """
        Returns ML-based anomaly alerts.
        """

        self.partial_fit(event)
        scores = self.score_event(event)

        alerts: List[Alert] = []

        # Thresholds (tunable)
        if scores["iso_score"] > 0.65:
            alerts.append(self._make_alert(
                "ML_ISO_ANOMALY",
                "Isolation Forest anomaly detected",
                "high",
                event,
                scores
            ))

        if scores["svm_score"] > 0.75:
            alerts.append(self._make_alert(
                "ML_SVM_ANOMALY",
                "One-Class SVM anomaly detected",
                "medium",
                event,
                scores
            ))

        return alerts

    # ---------------------------------------------------------
    # ALERT CREATOR
    # ---------------------------------------------------------
    def _make_alert(self, rule_id: str, title: str, severity: str,
                    event: Event, scores: Dict[str, float]) -> Alert:

        return Alert(
            id=str(uuid.uuid4()),
            rule_id=rule_id,
            title=title,
            description=f"{title}. Scores: {scores}",
            severity=severity,
            timestamp=datetime.utcnow(),
            host=event.host,
            user=event.user,
            src_ip=event.src_ip,
            dst_ip=event.dst_ip,
            event_id=event.id,
            extra={"scores": scores}
        )
