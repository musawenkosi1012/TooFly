import os
import requests
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from current directory
load_dotenv(".env")

# 1. Test Supabase API via simple HTTP request (since SDK failed to build)
URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

print(f"--- Testing Supabase API: {URL} ---")
if not URL or not ANON_KEY:
    print("[FAILED] SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env")
else:
    try:
        # Test connection by pinging the auth endpoint
        response = requests.get(
            f"{URL}/auth/v1/settings",
            headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"},
            timeout=10
        )
        if response.status_code == 200:
            print("[SUCCESS] Supabase API responded correctly.")
        else:
            print(f"[FAILED] Supabase API responded with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[FAILED] Connectivity error: {str(e)}")

# 2. Test Postgres Connection
DB_URL = os.getenv("POSTGRES_URL")
if not DB_URL:
    USER = os.getenv("DB_USER")
    PW = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT", "5432")
    NAME = os.getenv("DB_NAME", "postgres")
    DB_URL = f"postgresql://{USER}:{PW}@{HOST}:{PORT}/{NAME}?sslmode=require"

print(f"\n--- Testing Database Connection ---")
if "@" not in DB_URL:
    print("[FAILED] Invalid POSTGRES_URL or missing DB credentials.")
else:
    try:
        # Log host for verification (masking password)
        display_host = DB_URL.split('@')[-1].split('/')[0]
        print(f"Target Host: {display_host}")
        
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            res = conn.execute(text("SELECT version();")).fetchone()
            print(f"[SUCCESS] Postgres Connected!")
            print(f"Postgres Version: {res[0]}")
    except Exception as e:
        print(f"[FAILED] Database connectivity error: {str(e)}")
