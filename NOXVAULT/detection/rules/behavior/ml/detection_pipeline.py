# noxvault/detection/detection_pipeline.py

from typing import List
from datetime import datetime

# ============================================================
# MODELS (your screenshot shows they live in main/agents/alerts)
# ============================================================
from main.agents.alerts.alert_model import Event, Alert

# ============================================================
# RULE ENGINE (your screenshot shows detection/rules/rule_engine.py)
# ============================================================
from detection.rules.rule_engine import rule_engine

# ============================================================
# BEHAVIOR ENGINE (your screenshot shows detection/rules/behavior/)
# ============================================================
from detection.rules.behavior.behavior_engine import BehaviorEngine

# ============================================================
# ML ANOMALY MODEL (your screenshot shows detection/rules/behavior/ml/)
# ============================================================
from detection.rules.behavior.ml.anomaly_model import AnomalyModel

# ============================================================
# ALERT STORE + WEBSOCKET (your screenshot shows detection/alerts/)
# ============================================================
from detection.alerts.alert_store import AlertStore
from detection.alerts.alert_websocket import manager as ws_manager


class DetectionPipeline:
    """
    Unified detection pipeline for NOXVAULT.
    Combines:
    - Rule-based detection
    - Behavioral analytics
    - ML anomaly detection
    - Alert storage
    - WebSocket broadcasting
    """

    def __init__(self):
        self.behavior_engine = BehaviorEngine()
        self.ml_engine = AnomalyModel()
        self.alert_store = AlertStore()

    # ---------------------------------------------------------
    # MAIN ENTRY POINT
    # ---------------------------------------------------------
    async def process_events(self, events: List[Event]) -> List[Alert]:
        all_alerts: List[Alert] = []

        for event in events:
            # 1. Rule-based detection
            rule_alerts = rule_engine.evaluate_event(event)
            all_alerts.extend(rule_alerts)

            # 2. Behavioral detection
            behavior_alerts = self.behavior_engine.evaluate(event)
            all_alerts.extend(behavior_alerts)

            # 3. ML anomaly detection
            ml_alerts = self.ml_engine.evaluate(event)
            all_alerts.extend(ml_alerts)

        # 4. Store alerts
        self.alert_store.add_many(all_alerts)

        # 5. Broadcast alerts live
        if all_alerts:
            await ws_manager.broadcast_alerts(all_alerts)

        return all_alerts
