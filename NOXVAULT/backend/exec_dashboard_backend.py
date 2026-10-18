from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import asyncio

app = FastAPI(title="NOXVAULT Executive Cyber Risk Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------

class RiskModel(BaseModel):
    score: int
    band: str
    text_level: str

class KPIModel(BaseModel):
    open_incidents: int
    open_incidents_trend: str
    mean_ttd: str
    mean_ttd_trend: str
    compliance: str
    compliance_trend: str

class BarItem(BaseModel):
    label: str
    value: int

class IncidentModel(BaseModel):
    id: str
    sev: str
    status: str
    owner: str
    age: str

class VulnerabilityModel(BaseModel):
    cve: str
    sev: str
    assets: int
    exploit: str
    target: str

class ExecSnapshot(BaseModel):
    risk: RiskModel
    kpis: KPIModel
    compliance_breakdown: List[BarItem]
    attack_surface: List[BarItem]
    incidents: List[IncidentModel]
    vulns: List[VulnerabilityModel]
    frameworks: List[BarItem]
    generated_at: str

# Payload the agent will POST
class ExecIngestPayload(BaseModel):
    risk: RiskModel
    kpis: KPIModel
    compliance_breakdown: List[BarItem]
    attack_surface: List[BarItem]
    incidents: List[IncidentModel]
    vulns: List[VulnerabilityModel]
    frameworks: List[BarItem]


# ---------- In‑memory state ----------

CURRENT_SNAPSHOT: ExecSnapshot | None = None
WEBSOCKET_CLIENTS: list[WebSocket] = []


def default_snapshot() -> ExecSnapshot:
    return ExecSnapshot(
        risk=RiskModel(
            score=72,
            band="Elevated exposure",
            text_level="elevated",
        ),
        kpis=KPIModel(
            open_incidents=7,
            open_incidents_trend="↓ 3 vs. last 30 days",
            mean_ttd="2.4h",
            mean_ttd_trend="↑ Slightly higher than target (2h)",
            compliance="87%",
            compliance_trend="↑ +5% vs. last quarter",
        ),
        compliance_breakdown=[
            BarItem(label="Identity & access management", value=82),
            BarItem(label="Network & perimeter security", value=89),
            BarItem(label="Endpoint protection", value=91),
            BarItem(label="Backup & recovery", value=85),
            BarItem(label="Third-party risk", value=76),
        ],
        attack_surface=[
            BarItem(label="External web applications", value=92),
            BarItem(label="Remote access / VPN", value=88),
            BarItem(label="Email & collaboration", value=79),
            BarItem(label="Cloud workloads", value=74),
            BarItem(label="On-prem infrastructure", value=68),
        ],
        incidents=[
            IncidentModel(id="INC-2417", sev="Critical", status="In progress", owner="SOC Lead", age="6h"),
            IncidentModel(id="INC-2412", sev="High", status="Open", owner="Blue Team", age="1.2d"),
            IncidentModel(id="INC-2399", sev="High", status="In progress", owner="IR Team", age="3.4d"),
            IncidentModel(id="INC-2381", sev="Medium", status="Closed", owner="SOC Tier 2", age="5.1d"),
        ],
        vulns=[
            VulnerabilityModel(cve="CVE-2024-12345", sev="Critical", assets=14,
                               exploit="Known exploit in the wild", target="7 days"),
            VulnerabilityModel(cve="CVE-2023-29876", sev="High", assets=31,
                               exploit="Actively exploited", target="14 days"),
            VulnerabilityModel(cve="CVE-2022-44123", sev="High", assets=22,
                               exploit="PoC available", target="21 days"),
            VulnerabilityModel(cve="CVE-2021-99887", sev="Medium", assets=47,
                               exploit="Limited exploitation", target="30 days"),
        ],
        frameworks=[
            BarItem(label="NIST CSF", value=84),
            BarItem(label="ISO 27001", value=81),
            BarItem(label="SOC 2", value=88),
            BarItem(label="CIS Controls", value=79),
        ],
        generated_at=datetime.utcnow().isoformat() + "Z",
    )


def get_snapshot() -> ExecSnapshot:
    global CURRENT_SNAPSHOT
    if CURRENT_SNAPSHOT is None:
        CURRENT_SNAPSHOT = default_snapshot()
    return CURRENT_SNAPSHOT


async def broadcast_snapshot():
    """Push current snapshot to all WebSocket clients."""
    if not WEBSOCKET_CLIENTS:
        return
    snap = get_snapshot()
    payload = snap.model_dump()
    dead: list[WebSocket] = []
    for ws in WEBSOCKET_CLIENTS:
        try:
            await ws.send_json(payload)
        except WebSocketDisconnect:
            dead.append(ws)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(ws)


# ---------- API polling endpoints ----------

@app.get("/exec/snapshot", response_model=ExecSnapshot)
def api_get_exec_snapshot():
    return get_snapshot()


@app.get("/health")
def health():
    snap = get_snapshot()
    return {
        "status": "ok",
        "risk_score": snap.risk.score,
        "open_incidents": snap.kpis.open_incidents,
        "generated_at": snap.generated_at,
        "ws_clients": len(WEBSOCKET_CLIENTS),
    }


# ---------- NOXVAULT Agent ingest ----------

@app.post("/exec/ingest", response_model=ExecSnapshot)
async def ingest_exec(payload: ExecIngestPayload):
    global CURRENT_SNAPSHOT
    CURRENT_SNAPSHOT = ExecSnapshot(
        risk=payload.risk,
        kpis=payload.kpis,
        compliance_breakdown=payload.compliance_breakdown,
        attack_surface=payload.attack_surface,
        incidents=payload.incidents,
        vulns=payload.vulns,
        frameworks=payload.frameworks,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )
    # push to WebSocket listeners
    await broadcast_snapshot()
    return CURRENT_SNAPSHOT


# ---------- WebSocket streaming ----------

@app.websocket("/ws/exec")
async def ws_exec(websocket: WebSocket):
    await websocket.accept()
    WEBSOCKET_CLIENTS.append(websocket)
    # send initial snapshot
    await websocket.send_json(get_snapshot().model_dump())
    try:
        while True:
            # we don't expect messages from client, but keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(websocket)
    except Exception:
        if websocket in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(websocket)
