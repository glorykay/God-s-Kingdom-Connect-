import time
import json
import re
import queue
import threading
import requests
from dataclasses import dataclass, asdict
from typing import Optional, List

BACKEND_URL = "http://127.0.0.1:8000/firewall/ingest"  # change to your AWS URL
FIREWALL_NAME = "edge-fw-01"
LOG_FILE = "/var/log/ufw.log"   # change to your real firewall log path
BATCH_SIZE = 50
FLUSH_INTERVAL = 3  # seconds

@dataclass
class FirewallEvent:
    time: str
    action: str
    src_ip: str
    dst_ip: str
    src_port: Optional[int]
    dst_port: Optional[int]
    proto: Optional[str]
    rule: Optional[str]
    firewall: str

FW_REGEX = re.compile(
    r"(?P<time>\w+\s+\d+\s+\d+:\d+:\d+)\s+\S+\s+\S+:\s+"
    r"(?P<action>ALLOW|ACCEPT|BLOCK|DENY|DROP)\s+.*"
    r"SRC=(?P<src_ip>\S+)\s+DST=(?P<dst_ip>\S+).*"
    r"PROTO=(?P<proto>\S+).*SPT=(?P<src_port>\d+).*DPT=(?P<dst_port>\d+)",
    re.IGNORECASE,
)

def parse_firewall_line(line: str) -> Optional[FirewallEvent]:
    m = FW_REGEX.search(line)
    if not m:
        return None
    gd = m.groupdict()
    action = gd["action"].upper()
    if action == "ACCEPT":
        action = "ALLOW"
    return FirewallEvent(
        time=gd["time"],
        action=action,
        src_ip=gd["src_ip"],
        dst_ip=gd["dst_ip"],
        src_port=int(gd["src_port"]),
        dst_port=int(gd["dst_port"]),
        proto=gd["proto"].upper(),
        rule=None,
        firewall=FIREWALL_NAME,
    )

event_queue: "queue.Queue[FirewallEvent]" = queue.Queue()

def tail_file(path: str):
    with open(path, "r") as f:
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.2)
                continue
            ev = parse_firewall_line(line)
            if ev:
                event_queue.put(ev)

def sender_loop():
    buffer: List[FirewallEvent] = []
    last_flush = time.time()
    while True:
        try:
            try:
                ev = event_queue.get(timeout=1)
                buffer.append(ev)
            except queue.Empty:
                pass
            now = time.time()
            if buffer and (len(buffer) >= BATCH_SIZE or now - last_flush >= FLUSH_INTERVAL):
                payload = [asdict(e) for e in buffer]
                try:
                    r = requests.post(
                        BACKEND_URL,
                        data=json.dumps(payload),
                        headers={"Content-Type": "application/json"},
                        timeout=5,
                    )
                    if r.status_code != 200:
                        print("Ingest error:", r.status_code, r.text)
                except Exception as e:
                    print("Ingest exception:", e)
                buffer.clear()
                last_flush = now
        except KeyboardInterrupt:
            break

def main():
    t_tail = threading.Thread(target=tail_file, args=(LOG_FILE,), daemon=True)
    t_tail.start()
    print(f"[NOXVAULT] Firewall collector watching {LOG_FILE} as {FIREWALL_NAME}")
    sender_loop()

if __name__ == "__main__":
    main()
