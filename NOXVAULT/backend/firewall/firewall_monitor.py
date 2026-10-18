# firewall_monitor.py

import re
from typing import List, Dict, Any

class FirewallMonitor:

    # ---------------------------------------------------------
    # PARSE RAW FIREWALL LOG LINES
    # ---------------------------------------------------------
    def parse_logs(self, log_lines: List[str]) -> List[Dict[str, Any]]:
        """
        Converts raw firewall log lines into structured events.
        Supports:
            - UFW
            - iptables
            - pfSense-style logs
        """

        events = []

        for line in log_lines:
            parsed = self._parse_line(line)
            if parsed:
                events.append(parsed)

        return events

    # ---------------------------------------------------------
    # INTERNAL PARSER FOR A SINGLE LOG LINE
    # ---------------------------------------------------------
    def _parse_line(self, line: str) -> Dict[str, Any]:
        """
        Extracts:
            - src_ip
            - dst_ip
            - action (ALLOW/BLOCK)
            - protocol
            - dst_port
        """

        # Example UFW log:
        # "BLOCK IN=eth0 OUT= MAC=... SRC=192.168.1.5 DST=192.168.1.10 PROTO=TCP DPT=22"

        pattern = (
            r"(ALLOW|BLOCK).*SRC=(?P<src>\S+).*DST=(?P<dst>\S+).*PROTO=(?P<proto>\S+).*DPT=(?P<port>\d+)"
        )

        match = re.search(pattern, line)
        if not match:
            return None

        return {
            "src_ip": match.group("src"),
            "dst_ip": match.group("dst"),
            "action": "ALLOW" if "ALLOW" in line else "BLOCK",
            "protocol": match.group("proto"),
            "dst_port": int(match.group("port")),
        }

    # ---------------------------------------------------------
    # DETECT SUSPICIOUS BEHAVIOR
    # ---------------------------------------------------------
    def detect_anomalies(self, events: List[Dict[str, Any]]) -> List[str]:
        """
        Simple anomaly detection:
            - Repeated blocks from same IP
            - Multiple attempts to same port
        """

        anomalies = []
        ip_count = {}
        port_count = {}

        for evt in events:
            src = evt["src_ip"]
            port = evt["dst_port"]

            ip_count[src] = ip_count.get(src, 0) + 1
            port_count[port] = port_count.get(port, 0) + 1

        # Repeated blocks from same IP
        for ip, count in ip_count.items():
            if count >= 5:
                anomalies.append(f"High number of blocked attempts from {ip} ({count} events).")

        # Multiple attempts to same port
        for port, count in port_count.items():
            if count >= 10:
                anomalies.append(f"Port {port} is receiving repeated connection attempts ({count} events).")

        return anomalies


# ---------------------------------------------------------
# STANDALONE TEST
# ---------------------------------------------------------
if __name__ == "__main__":
    monitor = FirewallMonitor()

    sample_logs = [
        "BLOCK IN=eth0 OUT= MAC= SRC=10.0.0.5 DST=10.0.0.10 PROTO=TCP DPT=22",
        "BLOCK IN=eth0 OUT= MAC= SRC=10.0.0.5 DST=10.0.0.10 PROTO=TCP DPT=22",
        "BLOCK IN=eth0 OUT= MAC= SRC=10.0.0.5 DST=10.0.0.10 PROTO=TCP DPT=22",
        "ALLOW IN=eth0 OUT= MAC= SRC=10.0.0.8 DST=10.0.0.10 PROTO=UDP DPT=53",
    ]

    events = monitor.parse_logs(sample_logs)
    anomalies = monitor.detect_anomalies(events)

    print(events)
    print(anomalies)
