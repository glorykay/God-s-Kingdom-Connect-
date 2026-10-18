# noxvault/detection/rule_engine.py

from typing import List
from core.models import Event, Alert

# Import rule sets
from detection.rules.process_rules import PROCESS_RULES
from detection.rules.network_rules import NETWORK_RULES
from detection.rules.auth_rules import AUTH_RULES
from detection.rules.file_rules import FILE_RULES


class RuleEngine:
    def __init__(self):
        # Combine all rule sets into one list
        self.rules = (
            PROCESS_RULES +
            NETWORK_RULES +
            AUTH_RULES +
            FILE_RULES
        )

    def evaluate_event(self, event: Event) -> List[Alert]:
        """Run all rules against a single event."""
        alerts: List[Alert] = []

        for rule in self.rules:
            alert = rule.evaluate(event)
            if alert:
                alerts.append(alert)

        return alerts

    def evaluate_batch(self, events: List[Event]) -> List[Alert]:
        """Run detection on a batch of events."""
        all_alerts: List[Alert] = []

        for event in events:
            alerts = self.evaluate_event(event)
            all_alerts.extend(alerts)

        return all_alerts


# Global engine instance
rule_engine = RuleEngine()
