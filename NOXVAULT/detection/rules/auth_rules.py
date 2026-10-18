# noxvault/detection/rules/auth_rules.py

from detection.rules import DetectionRule
from core.models import Event

# -----------------------------------------
# AUTHENTICATION RULES FOR NOXVAULT DETECTION ENGINE
# -----------------------------------------

RULES = []

# 1. Brute-force login detection
RULES.append(
    DetectionRule(
        rule_id="AUTH_BRUTE_FORCE",
        name="Possible brute-force login attack",
        severity="high",
        description="Multiple failed login attempts detected from same user or IP.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_failed"
            and int(e.data.get("fail_count", 0)) >= 5
        )
    )
)

# 2. Password spraying detection
RULES.append(
    DetectionRule(
        rule_id="AUTH_PASSWORD_SPRAY",
        name="Password spraying attack detected",
        severity="high",
        description="Multiple users targeted with failed login attempts from same IP.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_failed"
            and int(e.data.get("unique_users_last_min", 0)) >= 10
        )
    )
)

# 3. Impossible travel detection
RULES.append(
    DetectionRule(
        rule_id="AUTH_IMPOSSIBLE_TRAVEL",
        name="Impossible travel login",
        severity="medium",
        description="User logged in from two distant locations in an impossible time window.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_success"
            and e.data.get("impossible_travel", False) is True
        )
    )
)

# 4. Privilege escalation login
RULES.append(
    DetectionRule(
        rule_id="AUTH_PRIV_ESC",
        name="Privilege escalation login",
        severity="critical",
        description="User account suddenly gained admin or elevated privileges.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "privilege_change"
            and e.data.get("new_role") in ["admin", "root", "domain_admin"]
        )
    )
)

# 5. Suspicious admin login outside normal hours
RULES.append(
    DetectionRule(
        rule_id="AUTH_ADMIN_ODD_HOURS",
        name="Admin login outside normal hours",
        severity="high",
        description="Admin account logged in during unusual or suspicious hours.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_success"
            and e.user in ["admin", "administrator", "root"]
            and int(e.data.get("hour", 0)) not in range(7, 19)  # 7 AM – 7 PM normal
        )
    )
)

# 6. MFA bypass attempt
RULES.append(
    DetectionRule(
        rule_id="AUTH_MFA_BYPASS",
        name="Possible MFA bypass attempt",
        severity="critical",
        description="User logged in without MFA where MFA is required.",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_success"
            and e.data.get("mfa_required", False) is True
            and e.data.get("mfa_used", False) is False
        )
    )
)

# 7. Lateral movement via authentication
RULES.append(
    DetectionRule(
        rule_id="AUTH_LATERAL_MOVEMENT",
        name="Suspicious lateral movement authentication",
        severity="high",
        description="Authentication attempt to another internal host (possible lateral movement).",
        condition=lambda e: (
            e.category == "auth"
            and e.action == "login_success"
            and e.data.get("target_host", "").startswith("10.")  # internal network
            and e.data.get("method") in ["winrm", "rdp", "smb"]
        )
    )
)

# Export rules for loader
AUTH_RULES = RULES
