# noxvault/detection/rules/process_rules.py

from detection.rules import DetectionRule
from core.models import Event

# -----------------------------------------
# PROCESS RULES FOR NOXVAULT DETECTION ENGINE
# -----------------------------------------

RULES = []

# 1. Suspicious process executed from temp directory
RULES.append(
    DetectionRule(
        rule_id="PROC_TEMP_EXEC",
        name="Process executed from temporary directory",
        severity="medium",
        description="A process was executed from a temp or user-writable directory. "
                    "This is commonly used by malware and droppers.",
        condition=lambda e: (
            e.category == "process"
            and "path" in e.data
            and any(p in e.data["path"].lower() for p in [
                "/tmp/", "/var/tmp/", "\\temp\\", "appdata\\local\\temp"
            ])
        )
    )
)

# 2. Suspicious PowerShell usage
RULES.append(
    DetectionRule(
        rule_id="PROC_POWERSHELL_SUSPICIOUS",
        name="Suspicious PowerShell execution",
        severity="high",
        description="PowerShell executed with suspicious flags or encoded commands.",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("process_name", "").lower() in ["powershell.exe", "pwsh.exe"]
            and any(flag in e.data.get("cmdline", "").lower() for flag in [
                "-enc", "-encodedcommand", "iex", "invoke-webrequest", "downloadstring"
            ])
        )
    )
)

# 3. Process spawning cmd.exe or powershell.exe (LOLBIN behavior)
RULES.append(
    DetectionRule(
        rule_id="PROC_LOLBIN_SPAWN",
        name="Suspicious LOLBIN process spawn",
        severity="high",
        description="A trusted process spawned a known LOLBIN (cmd, powershell, wscript).",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("parent_process", "").lower() in [
                "winword.exe", "excel.exe", "outlook.exe", "acrord32.exe"
            ]
            and e.data.get("process_name", "").lower() in [
                "cmd.exe", "powershell.exe", "wscript.exe", "cscript.exe"
            ]
        )
    )
)

# 4. High-privilege escalation attempt
RULES.append(
    DetectionRule(
        rule_id="PROC_PRIV_ESC",
        name="Possible privilege escalation attempt",
        severity="critical",
        description="A process attempted to escalate privileges or modify system tokens.",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("privilege_escalation", False) is True
        )
    )
)

# 5. Process connecting to suspicious IP immediately after execution
RULES.append(
    DetectionRule(
        rule_id="PROC_SUSPICIOUS_NETWORK_BEHAVIOR",
        name="Process with immediate outbound network connection",
        severity="high",
        description="A newly spawned process immediately initiated an outbound connection. "
                    "This is common in malware droppers and C2 beacons.",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("network_activity", False) is True
            and int(e.data.get("seconds_since_start", 999)) <= 3
        )
    )
)

# 6. Execution of unsigned or unknown binary
RULES.append(
    DetectionRule(
        rule_id="PROC_UNSIGNED_BINARY",
        name="Unsigned or unknown binary executed",
        severity="medium",
        description="An unsigned or untrusted binary was executed on the system.",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("signed", "unknown") == "no"
        )
    )
)

# 7. Suspicious script interpreter usage
RULES.append(
    DetectionRule(
        rule_id="PROC_SCRIPT_INTERPRETER",
        name="Suspicious script interpreter execution",
        severity="medium",
        description="Execution of script interpreters often used in attacks.",
        condition=lambda e: (
            e.category == "process"
            and e.data.get("process_name", "").lower() in [
                "python.exe", "perl.exe", "ruby.exe", "node.exe", "bash"
            ]
            and "--exec" in e.data.get("cmdline", "").lower()
        )
    )
)

# Export rules for loader
PROCESS_RULES = RULES
