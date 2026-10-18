from fastapi import APIRouter, WebSocket
from datetime import datetime
import asyncio
import random

router = APIRouter()

# Fake chat intelligence feed (replace with real data later)
def generate_chat_intel():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "messages": [
            {
                "source": random.choice(["Slack", "Teams", "Discord"]),
                "content": random.choice([
                    "Suspicious login attempt detected.",
                    "User requested password reset.",
                    "Unusual admin activity noticed.",
                    "Multiple failed MFA attempts.",
                    "Potential phishing message flagged."
                ]),
                "severity": random.choice(["Low", "Medium", "High", "Critical"])
            }
        ]
    }

@router.websocket("/ws/chat-intel")
async def chat_intel_ws(websocket: WebSocket):
    await websocket.accept()
    while True:
        payload = generate_chat_intel()
        await websocket.send_json(payload)
        await asyncio.sleep(3)
