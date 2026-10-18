# system_health.py

import psutil
from typing import Dict, Any, List

class SystemHealth:

    # ---------------------------------------------------------
    # MAIN HEALTH SNAPSHOT
    # ---------------------------------------------------------
    def get_health_snapshot(self) -> Dict[str, Any]:
        """
        Returns a full system health snapshot:
            - CPU load
            - Memory usage
            - Disk usage
            - Network I/O
            - Running processes
        """

        return {
            "cpu": self._cpu_usage(),
            "memory": self._memory_usage(),
            "disk": self._disk_usage(),
            "network": self._network_stats(),
            "top_processes": self._top_processes()
        }

    # ---------------------------------------------------------
    # CPU USAGE
    # ---------------------------------------------------------
    def _cpu_usage(self) -> Dict[str, Any]:
        return {
            "percent": psutil.cpu_percent(interval=1),
            "cores": psutil.cpu_count(logical=True),
            "load_avg": psutil.getloadavg()
        }

    # ---------------------------------------------------------
    # MEMORY USAGE
    # ---------------------------------------------------------
    def _memory_usage(self) -> Dict[str, Any]:
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "used": mem.used,
            "percent": mem.percent
        }

    # ---------------------------------------------------------
    # DISK USAGE
    # ---------------------------------------------------------
    def _disk_usage(self) -> Dict[str, Any]:
        disk = psutil.disk_usage("/")
        return {
            "total": disk.total,
            "used": disk.used,
            "percent": disk.percent
        }

    # ---------------------------------------------------------
    # NETWORK STATS
    # ---------------------------------------------------------
    def _network_stats(self) -> Dict[str, Any]:
        net = psutil.net_io_counters()
        return {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "packets_sent": net.packets_sent,
            "packets_recv": net.packets_recv
        }

    # ---------------------------------------------------------
    # TOP PROCESSES BY CPU
    # ---------------------------------------------------------
    def _top_processes(self, limit: int = 5) -> List[Dict[str, Any]]:
        processes = []

        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                processes.append(proc.info)
            except Exception:
                continue

        processes.sort(key=lambda p: p["cpu_percent"], reverse=True)
        return processes[:limit]


# ---------------------------------------------------------
# STANDALONE TEST
# ---------------------------------------------------------
if __name__ == "__main__":
    health = SystemHealth()
    snapshot = health.get_health_snapshot()
    print(snapshot)
