# noxvault/detection/rules/file_rules.py

from detection.rules import DetectionRule
from core.models import Event

# -----------------------------------------
# FILE RULES FOR NOXVAULT DETECTION ENGINE
# -----------------------------------------

RULES = []

# 1. Ransomware-like mass file modification
RULES.append(
    DetectionRule(
        rule_id="FILE_RANSOMWARE_MASS_WRITE",
        name="Mass file modification detected",
        severity="critical",
        description="A process is modifying a large number of files rapidly. "
                    "This is a strong indicator of ransomware.",
        condition=lambda e: (
            e.category == "file"
            and int(e.data.get("files_modified_last_min", 0)) >= 100
        )
    )
)

# 2. Suspicious file extension creation (.lock, .encrypted, .crypt)
SUSPICIOUS_EXTENSIONS = [
    ".lock", ".encrypted", ".crypt", ".enc", ".locked", ".pay", ".pay2"
]

RULES.append(
    DetectionRule(
        rule_id="FILE_SUSPICIOUS_EXTENSION",
        name="Suspicious encrypted file extension created",
        severity="high",
        description="A file was created with an extension commonly used by ransomware.",
        condition=lambda e: (
            e.category == "file"
            and "filename" in e.data
            and any(e.data["filename"].lower().endswith(ext)
                    for ext in SUSPICIOUS_EXTENSIONS)
        )
    )
)

# 3. Unauthorized modification of system files
SYSTEM_PATHS = [
    "/etc/passwd", "/etc/shadow", "/etc/sudoers",
    "c:\\windows\\system32\\drivers",
    "c:\\windows\\system32\\config"
]

RULES.append(
    DetectionRule(
        rule_id="FILE_SYSTEM_MODIFICATION",
        name="Unauthorized system file modification",
        severity="critical",
        description="A protected system file or directory was modified.",
        condition=lambda e: (
            e.category == "file"
            and "path" in e.data
            and any(p in e.data["path"].lower() for p in SYSTEM_PATHS)
        )
    )
)

# 4. Suspicious file dropped in startup/persistence locations
PERSISTENCE_PATHS = [
    "c:\\users\\", "\\appdata\\roaming\\microsoft\\windows\\start menu\\programs\\startup",
    "/etc/init.d/", "/etc/systemd/system/", "~/.config/autostart/"
]

RULES.append(
    DetectionRule(
        rule_id="FILE_PERSISTENCE_DROP",
        name="File dropped in persistence directory",
        severity="high",
        description="A file was created in a known persistence location.",
        condition=lambda e: (
            e.category == "file"
            and "path" in e.data
            and any(p in e.data["path"].lower() for p in PERSISTENCE_PATHS)
        )
    )
)

# 5. Suspicious script file created (.ps1, .vbs, .js, .sh)
SCRIPT_EXTENSIONS = [".ps1", ".vbs", ".js", ".jse", ".wsf", ".sh", ".bash"]

RULES.append(
    DetectionRule(
        rule_id="FILE_SUSPICIOUS_SCRIPT",
        name="Suspicious script file created",
        severity="medium",
        description="A script file was created, which may indicate malware staging.",
        condition=lambda e: (
            e.category == "file"
            and "filename" in e.data
            and any(e.data["filename"].lower().endswith(ext)
                    for ext in SCRIPT_EXTENSIONS)
        )
    )
)

# 6. File deletion spike (possible ransomware wiping shadow copies)
RULES.append(
    DetectionRule(
        rule_id="FILE_MASS_DELETE",
        name="Mass file deletion detected",
        severity="high",
        description="A large number of files were deleted in a short time.",
        condition=lambda e: (
            e.category == "file"
            and int(e.data.get("files_deleted_last_min", 0)) >= 50
        )
    )
)

# 7. Suspicious file downloaded from internet
RULES.append(
    DetectionRule(
        rule_id="FILE_INTERNET_DOWNLOAD",
        name="Suspicious file downloaded from internet",
        severity="medium",
        description="A file was downloaded from an untrusted or unknown URL.",
        condition=lambda e: (
            e.category == "file"
            and e.data.get("source", "") == "internet"
            and e.data.get("url_reputation", "unknown") == "bad"
        )
    )
)

# Export rules for loader
FILE_RULES = RULES
