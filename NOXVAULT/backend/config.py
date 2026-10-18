import yaml
import os

CONFIG_FILE = "config.yaml"


def load_yaml_config():
    """
    Loads configuration from config.yaml if it exists.
    """
    if not os.path.exists(CONFIG_FILE):
        print(f"[NOXVAULT] config.yaml not found, using defaults.")
        return {}

    with open(CONFIG_FILE, "r") as file:
        return yaml.safe_load(file) or {}


def get_config():
    """
    Returns the full configuration for NOXVAULT.
    Priority:
    1. Environment variables
    2. config.yaml
    3. Default values
    """
    yaml_config = load_yaml_config()

    return {
        "backend_url": os.getenv("BACKEND_URL", yaml_config.get("backend_url", "http://127.0.0.1:8000")),
        "agent_token": os.getenv("AGENT_TOKEN", yaml_config.get("agent_token", "default-token")),
        "interval": int(os.getenv("INTERVAL", yaml_config.get("interval", 30))),
        "modules": {
            "system": yaml_config.get("modules", {}).get("system", True),
            "network": yaml_config.get("modules", {}).get("network", True),
            "firewall": yaml_config.get("modules", {}).get("firewall", True),
            "security": yaml_config.get("modules", {}).get("security", True),
            "traffic": yaml_config.get("modules", {}).get("traffic", True),
            "malware": yaml_config.get("modules", {}).get("malware", True),
        }
    }


if __name__ == "__main__":
    # Test output
    import json
    print(json.dumps(get_config(), indent=4))
