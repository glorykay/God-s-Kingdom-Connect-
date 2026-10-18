import sqlite3
import os

DB_NAME = "noxvault.db"


def get_db():
    """
    Opens a connection to the SQLite database.
    Ensures foreign keys are enabled.
    Returns a connection object.
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """
    Creates the database file and tables if they do not exist.
    You can expand this with more tables later.
    """
    if not os.path.exists(DB_NAME):
        print("[NOXVAULT] Creating database...")

    conn = get_db()
    cursor = conn.cursor()

    # Example users table (expand as needed)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    """)

    # Example audit logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            system TEXT,
            network TEXT,
            firewall TEXT,
            security TEXT,
            traffic TEXT,
            malware TEXT
        );
    """)

    conn.commit()
    conn.close()
    print("[NOXVAULT] Database initialized.")


if __name__ == "__main__":
    init_db()
