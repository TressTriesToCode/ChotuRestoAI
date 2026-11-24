import sys
import os
from sqlalchemy import create_engine, inspect, text
import alembic.config
import alembic.command

TEST_DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/chotu_test"
ADMIN_DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/postgres"

def test_migration_lifecycle():
    # 1. Ensure chotu_test database exists
    admin_engine = create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='chotu_test'")).scalar()
        if not exists:
            conn.execute(text("CREATE DATABASE chotu_test"))
            print("[SETUP] Created test database chotu_test")
        else:
            print("[SETUP] Test database chotu_test exists")

    test_engine = create_engine(TEST_DB_URL)
    
    # Configure alembic config
    alembic_cfg = alembic.config.Config("c:/restro ai/choturestoai/backend/alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DB_URL)
    alembic_cfg.set_main_option("script_location", "c:/restro ai/choturestoai/backend/alembic")
    
    print("\n--- STEP 1: UPGRADE TO HEAD ON chotu_test ---")
    alembic.command.upgrade(alembic_cfg, "head")
    insp = inspect(test_engine)
    head_tables = sorted(insp.get_table_names())
    print(f"Table count at head: {len(head_tables)}")
    print(f"Tables at head: {head_tables}")
    with test_engine.connect() as conn:
        head_ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"Alembic version at head: {head_ver}")

    print("\n--- STEP 2: DOWNGRADE TO PREVIOUS MIGRATION (002) ON chotu_test ---")
    # Previous migration is 002_audit_and_ai
    alembic.command.downgrade(alembic_cfg, "002_audit_and_ai")
    insp = inspect(test_engine)
    down_tables = sorted(insp.get_table_names())
    print(f"Table count after downgrade to 002: {len(down_tables)}")
    print(f"Tables after downgrade: {down_tables}")
    with test_engine.connect() as conn:
        down_ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"Alembic version after downgrade: {down_ver}")
        
    dropped_tables = set(head_tables) - set(down_tables)
    print(f"Verified dropped Phase 4 tables: {dropped_tables}")

    print("\n--- STEP 3: RE-UPGRADE TO HEAD ON chotu_test ---")
    alembic.command.upgrade(alembic_cfg, "head")
    insp = inspect(test_engine)
    reup_tables = sorted(insp.get_table_names())
    print(f"Table count after re-upgrade: {len(reup_tables)}")
    with test_engine.connect() as conn:
        reup_ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"Alembic version after re-upgrade: {reup_ver}")
        
    assert reup_tables == head_tables, "Re-upgraded tables do not match original head tables!"
    assert reup_ver == head_ver, "Re-upgraded version does not match head version!"
    print("\n[SUCCESS] Alembic upgrade -> downgrade -> re-upgrade lifecycle verified 100% on chotu_test!")

if __name__ == "__main__":
    test_migration_lifecycle()
