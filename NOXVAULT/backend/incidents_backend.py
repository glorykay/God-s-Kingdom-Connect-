from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import os
import uuid
import json

DB_PATH = "incidents.db"
UPLOAD_DIR = "incident_evidence"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="NOXVAULT Incident Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def now_iso():
    return datetime.utcnow().isoformat() + "Z"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT,
        severity TEXT,
        status TEXT,
        analyst TEXT,
        tags TEXT,
        mitre_id TEXT,
        mitre_technique TEXT,
        evidence_path TEXT,
        evidence_url TEXT,
        source_ioc TEXT,
        source_type TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)
    c.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        timestamp TEXT,
        author TEXT,
        text TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

class IncidentNote(BaseModel):
    id: str
    timestamp: str
    author: str
    text: str

class Incident(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    analyst: Optional[str]
    tags: List[str]
    mitre_id: Optional[str]
    mitre_technique: Optional[str]
    evidence_url: Optional[str]
    created_at: str
    updated_at: str
    notes: List[IncidentNote] = []
    source_ioc: Optional[str]
    source_type: Optional[str]

def row_to_incident(row, notes):
    return Incident(
        id=row[0],
        title=row[1],
        severity=row[2],
        status=row[3],
        analyst=row[4],
        tags=row[5].split(",") if row[5] else [],
        mitre_id=row[6],
        mitre_technique=row[7],
        evidence_url=row[9],
        created_at=row[12],
        updated_at=row[13],
        notes=notes,
        source_ioc=row[10],
        source_type=row[11],
    )

@app.get("/incidents", response_model=List[Incident])
def list_incidents():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM incidents")
    rows = c.fetchall()
    incidents = []
    for r in rows:
        c.execute(
            "SELECT id,timestamp,author,text FROM notes WHERE incident_id=? ORDER BY timestamp ASC",
            (r[0],),
        )
        nrows = c.fetchall()
        notes = [
            IncidentNote(id=n[0], timestamp=n[1], author=n[2], text=n[3])
            for n in nrows
        ]
        incidents.append(row_to_incident(r, notes))
    conn.close()
    return incidents

@app.get("/incidents/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM incidents WHERE id=?", (incident_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Incident not found")
    c.execute(
        "SELECT id,timestamp,author,text FROM notes WHERE incident_id=? ORDER BY timestamp ASC",
        (incident_id,),
    )
    nrows = c.fetchall()
    notes = [
        IncidentNote(id=n[0], timestamp=n[1], author=n[2], text=n[3])
        for n in nrows
    ]
    conn.close()
    return row_to_incident(row, notes)

@app.post("/incidents", response_model=Incident)
async def create_incident(
    title: str = Form(...),
    severity: str = Form("Medium"),
    analyst: str = Form("Unassigned"),
    tags: str = Form(""),
    mitre_id: str = Form(""),
    mitre_technique: str = Form(""),
    evidence_url: str = Form(""),
    source_ioc: str = Form(""),
    source_type: str = Form(""),
    evidence: UploadFile = File(None),
):
    inc_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    ts = now_iso()
    evidence_path = None

    if evidence:
        fname = f"{inc_id}_{evidence.filename}"
        fpath = os.path.join(UPLOAD_DIR, fname)
        with open(fpath, "wb") as f:
            f.write(await evidence.read())
        evidence_path = fpath

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO incidents (
            id,title,severity,status,analyst,tags,mitre_id,mitre_technique,
            evidence_path,evidence_url,source_ioc,source_type,created_at,updated_at
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            inc_id,
            title,
            severity,
            "Open",
            analyst,
            tags,
            mitre_id,
            mitre_technique,
            evidence_path,
            evidence_url,
            source_ioc,
            source_type,
            ts,
            ts,
        ),
    )
    note_id = uuid.uuid4().hex[:8]
    c.execute(
        """
        INSERT INTO notes (id,incident_id,timestamp,author,text)
        VALUES (?,?,?,?,?)
        """,
        (note_id, inc_id, ts, "System", "Incident created."),
    )
    conn.commit()
    conn.close()
    return get_incident(inc_id)

@app.post("/incidents/{incident_id}/update", response_model=Incident)
def update_incident(
    incident_id: str,
    severity: str = Form(...),
    status: str = Form(...),
    analyst: str = Form(...),
    tags: str = Form(""),
    mitre_id: str = Form(""),
    mitre_technique: str = Form(""),
    evidence_url: str = Form(""),
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM incidents WHERE id=?", (incident_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(404, "Incident not found")
    ts = now_iso()
    c.execute(
        """
        UPDATE incidents
        SET severity=?, status=?, analyst=?, tags=?, mitre_id=?, mitre_technique=?, evidence_url=?, updated_at=?
        WHERE id=?
        """,
        (severity, status, analyst, tags, mitre_id, mitre_technique, evidence_url, ts, incident_id),
    )
    conn.commit()
    conn.close()
    return get_incident(incident_id)

@app.post("/incidents/{incident_id}/note", response_model=Incident)
def add_note(
    incident_id: str,
    author: str = Form("Analyst"),
    text: str = Form(...),
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM incidents WHERE id=?", (incident_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(404, "Incident not found")
    note_id = uuid.uuid4().hex[:8]
    ts = now_iso()
    c.execute(
        """
        INSERT INTO notes (id,incident_id,timestamp,author,text)
        VALUES (?,?,?,?,?)
        """,
        (note_id, incident_id, ts, author, text),
    )
    c.execute("UPDATE incidents SET updated_at=? WHERE id=?", (ts, incident_id))
    conn.commit()
    conn.close()
    return get_incident(incident_id)

@app.post("/incidents/{incident_id}/evidence", response_model=Incident)
async def upload_evidence(
    incident_id: str,
    evidence: UploadFile = File(...),
):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id FROM incidents WHERE id=?", (incident_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(404, "Incident not found")

    fname = f"{incident_id}_{evidence.filename}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f:
        f.write(await evidence.read())

    ts = now_iso()
    c.execute(
        "UPDATE incidents SET evidence_path=?, updated_at=? WHERE id=?",
        (fpath, ts, incident_id),
    )
    note_id = uuid.uuid4().hex[:8]
    c.execute(
        """
        INSERT INTO notes (id,incident_id,timestamp,author,text)
        VALUES (?,?,?,?,?)
        """,
        (note_id, incident_id, ts, "System", f"Evidence file attached: {evidence.filename}"),
    )
    conn.commit()
    conn.close()
    return get_incident(incident_id)

# --- MITRE ATT&CK AUTOCOMPLETE DATA ---

MITRE_TECHNIQUES = [
    {"id": "T1021", "technique": "Remote Services", "tactic": "Lateral Movement"},
    {"id": "T1059", "technique": "Command and Scripting Interpreter", "tactic": "Execution"},
    {"id": "T1047", "technique": "Windows Management Instrumentation", "tactic": "Execution"},
    {"id": "T1078", "technique": "Valid Accounts", "tactic": "Defense Evasion"},
    {"id": "T1110", "technique": "Brute Force", "tactic": "Credential Access"},
    {"id": "T1566", "technique": "Phishing", "tactic": "Initial Access"},
    {"id": "T1041", "technique": "Exfiltration Over C2 Channel", "tactic": "Exfiltration"},
]

@app.get("/mitre-techniques")
def mitre_techniques(q: str = ""):
    q = q.lower().strip()
    if not q:
        return MITRE_TECHNIQUES[:20]
    out = []
    for t in MITRE_TECHNIQUES:
        hay = f"{t['id']} {t['technique']} {t['tactic']}".lower()
        if q in hay:
            out.append(t)
    return out

@app.get("/health")
def health():
    return {"status": "ok", "time": now_iso()}
