# noxvault/detection/rules/network_rules.py

from detection.rules import DetectionRule
from core.models import Event

# -----------------------------------------
# NETWORK RULES FOR NOXVAULT DETECTION ENGINE
# -----------------------------------------

RULES = []

# 1. Outbound connection to known malicious IP (C2)
BLACKLISTED_IPS = {
    "185.23.44.12",
    "45.155.205.10",
    "103.214.7.55",
    "91.240.118.50"
}

RULES.append(
    DetectionRule(
        rule_id="NET_C2_OUTBOUND",
        name="Outbound connection to known malicious IP",
        severity="critical",
        description="Host is connecting to a known malicious or C2 IP address.",
        condition=lambda e: (
            e.category == "network"
            and e.dst_ip in BLACKLISTED_IPS
        )
    )
)

# 2. Port scanning behavior (multiple ports hit quickly)
RULES.append(
    DetectionRule(
        rule_id="NET_PORT_SCAN",
        name="Possible port scanning activity",
        severity="high",
        description="Multiple outbound connections to many ports in a short time.",
        condition=lambda e: (
            e.category == "network"
            and int(e.data.get("unique_ports_last_min", 0)) >= 20
        )
    )
)

# 3. Lateral movement attempt (SMB, RDP, WinRM)
LATERAL_PORTS = {445, 3389, 5985, 5986}

RULES.append(
    DetectionRule(
        rule_id="NET_LATERAL_MOVEMENT",
        name="Possible lateral movement attempt",
        severity="high",
        description="Connection attempt to internal host using SMB/RDP/WinRM.",
        condition=lambda e: (
            e.category == "network"
            and e.dst_ip
            and e.dst_ip.startswith("10.")  # internal network
            and int(e.data.get("dst_port", 0)) in LATERAL_PORTS
        )
    )
)

# 4. Beaconing behavior (regular timed connections)
RULES.append(
    DetectionRule(
        rule_id="NET_BEACONING",
        name="Possible C2 beaconing behavior",
        severity="medium",
        description="Regular timed outbound connections detected (possible malware beacon).",
        condition=lambda e: (
            e.category == "network"
            and float(e.data.get("interval_seconds", 9999)) <= 60
            and int(e.data.get("repeat_count", 0)) >= 5
        )
    )
)

# 5. DNS tunneling detection
RULES.append(
    DetectionRule(
        rule_id="NET_DNS_TUNNELING",
        name="Suspicious DNS tunneling activity",
        severity="high",
        description="Large DNS queries or encoded data detected in DNS traffic.",
        condition=lambda e: (
            e.category == "network"
            and e.data.get("protocol", "").lower() == "dns"
            and int(e.data.get("query_length", 0)) >= 100
        )
    )
)

# 6. Outbound traffic spike (possible data exfiltration)
RULES.append(
    DetectionRule(
        rule_id="NET_DATA_EXFIL",
        name="Possible data exfiltration",
        severity="critical",
        description="Unusual outbound traffic volume detected.",
        condition=lambda e: (
            e.category == "network"
            and int(e.data.get("bytes_out_last_min", 0)) >= 50000000  # 50MB/min
        )
    )
)

# 7. Suspicious connection to rare country
RARE_COUNTRIES = {"RU", "KP", "IR", "CN"}

RULES.append(
    DetectionRule(
        rule_id="NET_RARE_COUNTRY",
        name="Connection to high‑risk country",
        severity="medium",
        description="Outbound connection to a country rarely contacted by this organization.",
        condition=lambda e: (
            e.category == "network"
            and e.data.get("dst_country") in RARE_COUNTRIES
        )
    )
)

# Export rules for loader
NETWORK_RULES = RULES
