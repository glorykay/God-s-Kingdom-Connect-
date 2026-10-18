# noxvault/detection/behavior/baseline_manager.py

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from threading import Lock


class BaselineManager:
    """
    Stores and updates behavioral baselines for:
    - Users
    - Hosts
    - Processes
    - Network patterns

    Baselines are simple statistical profiles:
    - average values
    - last seen values
    - time-of-day patterns
    - frequency patterns
    """

    def __init__(self):
        self.user_baselines: Dict[str, Dict[str, Any]] = {}
        self.host_baselines: Dict[str, Dict[str, Any]] = {}
        self.process_baselines: Dict[str, Dict[str, Any]] = {}
        self.network_baselines: Dict[str, Dict[str, Any]] = {}

        self.lock = Lock()

    # ---------------------------------------------------------
    # USER BASELINES
    # ---------------------------------------------------------
    def update_user_baseline(self, user: str, event: dict):
        with self.lock:
            baseline = self.user_baselines.setdefault(user, {
                "last_login_country": None,
                "avg_logins_per_hour": 0,
                "login_count": 0,
                "last_seen": None,
            })

            # Update login frequency
            baseline["login_count"] += 1
            baseline["avg_logins_per_hour"] = baseline["login_count"] / max(
                (datetime.utcnow() - datetime.utcnow().replace(hour=0, minute=0, second=0)).seconds / 3600, 1
            )

            # Update last login country
            if "country" in event:
                baseline["last_login_country"] = event["country"]

            baseline["last_seen"] = datetime.utcnow()

    def get_user_baseline(self, user: str) -> Optional[Dict[str, Any]]:
        return self.user_baselines.get(user)

    # ---------------------------------------------------------
    # HOST BASELINES
    # ---------------------------------------------------------
    def update_host_baseline(self, host: str, event: dict):
        with self.lock:
            baseline = self.host_baselines.setdefault(host, {
                "avg_cpu": 0,
                "avg_network_out": 0,
                "event_count": 0,
                "last_seen": None,
            })

            baseline["event_count"] += 1

            # Update CPU baseline
            if "cpu" in event:
                baseline["avg_cpu"] = (
                    baseline["avg_cpu"] * 0.9 + float(event["cpu"]) * 0.1
                )

            # Update network baseline
            if "bytes_out" in event:
                baseline["avg_network_out"] = (
                    baseline["avg_network_out"] * 0.9 + float(event["bytes_out"]) * 0.1
                )

            baseline["last_seen"] = datetime.utcnow()

    def get_host_baseline(self, host: str) -> Optional[Dict[str, Any]]:
        return self.host_baselines.get(host)

    # ---------------------------------------------------------
    # PROCESS BASELINES
    # ---------------------------------------------------------
    def update_process_baseline(self, process_name: str, event: dict):
        with self.lock:
            baseline = self.process_baselines.setdefault(process_name, {
                "avg_runtime": 0,
                "avg_memory": 0,
                "run_count": 0,
                "last_seen": None,
            })

            baseline["run_count"] += 1

            if "runtime" in event:
                baseline["avg_runtime"] = (
                    baseline["avg_runtime"] * 0.9 + float(event["runtime"]) * 0.1
                )

            if "memory" in event:
                baseline["avg_memory"] = (
                    baseline["avg_memory"] * 0.9 + float(event["memory"]) * 0.1
                )

            baseline["last_seen"] = datetime.utcnow()

    def get_process_baseline(self, process_name: str) -> Optional[Dict[str, Any]]:
        return self.process_baselines.get(process_name)

    # ---------------------------------------------------------
    # NETWORK BASELINES
    # ---------------------------------------------------------
    def update_network_baseline(self, host: str, event: dict):
        with self.lock:
            baseline = self.network_baselines.setdefault(host, {
                "avg_connections_per_min": 0,
                "connection_count": 0,
                "last_seen": None,
            })

            baseline["connection_count"] += 1

            baseline["avg_connections_per_min"] = (
                baseline["connection_count"] /
                max((datetime.utcnow() - datetime.utcnow().replace(second=0)).seconds / 60, 1)
            )

            baseline["last_seen"] = datetime.utcnow()

    def get_network_baseline(self, host: str) -> Optional[Dict[str, Any]]:
        return self.network_baselines.get(host)
