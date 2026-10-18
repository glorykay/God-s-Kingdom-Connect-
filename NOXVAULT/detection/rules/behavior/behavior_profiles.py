# noxvault/detection/behavior/behavior_profiles.py

from typing import Dict, Any


class BehaviorProfile:
    """
    Defines expected behavior patterns for different entity types.
    These profiles help the behavior engine decide what is 'normal'
    vs 'abnormal' for users, hosts, processes, and network activity.
    """

    # ---------------------------------------------------------
    # USER BEHAVIOR PROFILES
    # ---------------------------------------------------------
    USER_PROFILE_DEFAULTS: Dict[str, Any] = {
        "expected_login_hours": range(7, 19),  # 7 AM – 7 PM
        "max_login_spike_multiplier": 3,       # 3x normal login rate
        "country_change_alert": True,          # Alert on new country login
    }

    # ---------------------------------------------------------
    # HOST BEHAVIOR PROFILES
    # ---------------------------------------------------------
    HOST_PROFILE_DEFAULTS: Dict[str, Any] = {
        "cpu_spike_multiplier": 3,             # 3x baseline CPU
        "network_spike_multiplier": 4,         # 4x baseline outbound traffic
        "max_process_count_per_min": 200,      # abnormal process spawning
    }

    # ---------------------------------------------------------
    # PROCESS BEHAVIOR PROFILES
    # ---------------------------------------------------------
    PROCESS_PROFILE_DEFAULTS: Dict[str, Any] = {
        "runtime_spike_multiplier": 3,         # 3x baseline runtime
        "memory_spike_multiplier": 3,          # 3x baseline memory
        "rare_process_alert": True,            # alert if process rarely runs
    }

    # ---------------------------------------------------------
    # NETWORK BEHAVIOR PROFILES
    # ---------------------------------------------------------
    NETWORK_PROFILE_DEFAULTS: Dict[str, Any] = {
        "connection_spike_multiplier": 4,      # 4x baseline connections/min
        "max_unique_ports_per_min": 30,        # port scan threshold
        "alert_on_new_country": True,          # new geo-location
    }

    # ---------------------------------------------------------
    # PROFILE GETTERS
    # ---------------------------------------------------------
    @classmethod
    def get_user_profile(cls) -> Dict[str, Any]:
        return cls.USER_PROFILE_DEFAULTS.copy()

    @classmethod
    def get_host_profile(cls) -> Dict[str, Any]:
        return cls.HOST_PROFILE_DEFAULTS.copy()

    @classmethod
    def get_process_profile(cls) -> Dict[str, Any]:
        return cls.PROCESS_PROFILE_DEFAULTS.copy()

    @classmethod
    def get_network_profile(cls) -> Dict[str, Any]:
        return cls.NETWORK_PROFILE_DEFAULTS.copy()
