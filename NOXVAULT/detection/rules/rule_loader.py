# noxvault/detection/rule_loader.py

import importlib
import pkgutil
from typing import List
from detection.rules import DetectionRule

def load_rules_from_module(module_path: str) -> List[DetectionRule]:
    """
    Dynamically imports a rule module and extracts RULES or *_RULES list.
    """
    module = importlib.import_module(module_path)

    # Standard rule list name
    if hasattr(module, "RULES"):
        return getattr(module, "RULES")

    # Alternative naming (PROCESS_RULES, NETWORK_RULES, etc.)
    rule_lists = [
        attr for attr in dir(module)
        if attr.endswith("_RULES")
    ]

    collected = []
    for rl in rule_lists:
        collected.extend(getattr(module, rl))

    return collected


def load_all_rules() -> List[DetectionRule]:
    """
    Loads all rule modules inside detection.rules.* automatically.
    """
    rules: List[DetectionRule] = []

    # Path to the rules package
    package = "detection.rules"

    # Iterate through all modules in the rules folder
    for _, module_name, is_pkg in pkgutil.iter_modules(
        importlib.import_module(package).__path__
    ):
        if is_pkg:
            continue  # skip subpackages

        module_path = f"{package}.{module_name}"
        try:
            module_rules = load_rules_from_module(module_path)
            rules.extend(module_rules)
        except Exception as e:
            print(f"[RULE_LOADER] Failed to load {module_path}: {e}")

    return rules
