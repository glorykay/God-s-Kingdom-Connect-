# noxvault/detection/behavior/behavior_engine.py

from typing import List
from datetime import datetime
from core.models import Event, Alert
from detection.behavior.baseline_manager import BaselineManager
import uuid


class BehaviorEngine:
    """
    Detects anomalies by comparing events to user/host/process/network baselines.
    """

    def __init__(self):
        self.baselines = BaselineManager()

    # ---------------------------------------------------------
    # MAIN ENTRY POINT
    # ---------------------------------------------------------
    def evaluate(self, event: Event) -> List[Alert]:
        alerts: List[Alert] = []

        # Update baselines first
        self._update_baselines(event)

        # Then detect anomalies
        alerts.extend(self._detect_user_anomalies(event))
        alerts.extend(self._detect_host_anomalies(event))
        alerts.extend(self._detect_process_anomalies(event))
        alerts.extend(self._detect_network_anomalies(event))

        return alerts

    # ---------------------------------------------------------
    # BASELINE UPDATES
    # ---------------------------------------------------------
    def _update_baselines(self, event: Event):
        if event.user:
            self.baselines.update_user_baseline(event.user, event.data)

        if event.host:
            self.baselines.update_host_baseline(event.host, event.data)

        if event.category == "process" and "process_name" in event.data:
            self.baselines.update_process_baseline(
                event.data["process_name"], event.data
            )

        if event.category == "network" and event.host:
            self.baselines.update_network_baseline(event.host, event.data)

    # ---------------------------------------------------------
    # USER ANOMALIES
    # ---------------------------------------------------------
    def _detect_user_anomalies(self, event: Event) -> List[Alert]:
        alerts = []
        if not event.user:
            return alerts

        baseline = self.baselines.get_user_baseline(event.user)
        if not baseline:
            return alerts

        # 1. Login from new country
        if event.category == "auth" and event.action == "login_success":
            country = event.data.get("country")
            if country and baseline["last_login_country"] and country != baseline["last_login_country"]:
                alerts.append(self._make_alert(
                    "BEHAVIOR_NEW_COUNTRY",
                    "User logged in from a new country",
                    "medium",
                    event
                ))

        # 2. Login frequency spike
        if event.category == "auth" and event.action == "login_success":
            avg = baseline["avg_logins_per_hour"]
            if avg > 0 and event.data.get("logins_last_hour", 0) > avg * 3:
                alerts.append(self._make_alert(
                    "BEHAVIOR_LOGIN_SPIKE",
                    "Unusual spike in login frequency",
                    "high",
                    event
                ))

        return alerts

    # ---------------------------------------------------------
    # HOST ANOMALIES
    # ---------------------------------------------------------
    def _detect_host_anomalies(self, event: Event) -> List[Alert]:
        alerts = []
        if not event.host:
            return alerts

        baseline = self.baselines.get_host_baseline(event.host)
        if not baseline:
            return alerts

        # 1. CPU spike
        if "cpu" in event.data:
            if float(event.data["cpu"]) > baseline["avg_cpu"] * 3 and baseline["avg_cpu"] > 0:
                alerts.append(self._make_alert(
                    "BEHAVIOR_CPU_SPIKE",
                    "Host CPU usage is abnormally high",
                    "medium",
                    event
                ))

        # 2. Network spike
        if "bytes_out" in event.data:
            if float(event.data["bytes_out"]) > baseline["avg_network_out"] * 4 and baseline["avg_network_out"] > 0:
                alerts.append(self._make_alert(
                    "BEHAVIOR_NET_SPIKE",
                    "Host outbound network traffic is abnormally high",
                    "high",
                    event
                ))

        return alerts

    # ---------------------------------------------------------
    # PROCESS ANOMALIES
    # ---------------------------------------------------------
    def _detect_process_anomalies(self, event: Event) -> List[Alert]:
        alerts = []
        if event.category != "process":
            return alerts

        pname = event.data.get("process_name")
        if not pname:
            return alerts

        baseline = self.baselines.get_process_baseline(pname)
        if not baseline:
            return alerts

        # 1. Runtime anomaly
        if "runtime" in event.data:
            if float(event.data["runtime"]) > baseline["avg_runtime"] * 3 and baseline["avg_runtime"] > 0:
                alerts.append(self._make_alert(
                    "BEHAVIOR_PROC_RUNTIME",
                    "Process runtime is abnormally long",
                    "medium",
                    event
                ))

        # 2. Memory anomaly
        if "memory" in event.data:
            if float(event.data["memory"]) > baseline["avg_memory"] * 3 and baseline["avg_memory"] > 0:
                alerts.append(self._make_alert(
                    "BEHAVIOR_PROC_MEMORY",
                    "Process memory usage is abnormally high",
                    "high",
                    event
                ))

        return alerts

    # ---------------------------------------------------------
    # NETWORK ANOMALIES
    # ---------------------------------------------------------
    def _detect_network_anomalies(self, event: Event) -> List[Alert]:
        alerts = []
        if event.category != "network" or not event.host:
            return alerts

        baseline = self.baselines.get_network_baseline(event.host)
        if not baseline:
            return alerts

        # 1. Connection frequency anomaly
        if "connections_last_min" in event.data:
            if int(event.data["connections_last_min"]) > baseline["avg_connections_per_min"] * 4:
                alerts.append(self._make_alert(
                    "BEHAVIOR_CONN_SPIKE",
                    "Unusual spike in network connections",
                    "high",
                    event
                ))

        return alerts

    # ---------------------------------------------------------
    # ALERT CREATOR
    # ---------------------------------------------------------
    def _make_alert(self, rule_id: str, title: str, severity: str, event: Event) -> Alert:
        return Alert(
            id=str(uuid.uuid4()),
            rule_id=rule_id,
            title=title,
            description=title,
            severity=severity,
            timestamp=datetime.utcnow(),
            host=event.host,
            user=event.user,
            src_ip=event.src_ip,
            dst_ip=event.dst_ip,
            event_id=event.id,
        )
