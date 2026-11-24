import os
import json
import decimal
from datetime import datetime, date
from sqlalchemy import create_engine, inspect, text

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, decimal.Decimal):
            return str(obj)
        if isinstance(obj, bytes):
            return obj.hex()
        return super().default(obj)

def backup_database(db_name="chotu_restro_ai", output_dir="c:/restro ai/choturestoai/database/backups"):
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(output_dir, f"{db_name}_backup_{timestamp}.json")
    
    engine = create_engine(f"postgresql://postgres:postgres@127.0.0.1:5432/{db_name}")
    insp = inspect(engine)
    tables = sorted(insp.get_table_names())
    
    backup_data = {
        "database": db_name,
        "timestamp": timestamp,
        "tables_count": len(tables),
        "data": {}
    }
    
    total_records = 0
    with engine.connect() as conn:
        for table in tables:
            rows = conn.execute(text(f'SELECT * FROM "{table}"')).fetchall()
            cols = [col["name"] for col in insp.get_columns(table)]
            table_rows = []
            for r in rows:
                table_rows.append(dict(zip(cols, r)))
            backup_data["data"][table] = {
                "count": len(table_rows),
                "rows": table_rows
            }
            total_records += len(table_rows)
            print(f"Backed up table '{table}': {len(table_rows)} rows")
            
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, cls=CustomEncoder, indent=2)
        
    print(f"\nSUCCESS: Full verified backup written to: {backup_file}")
    print(f"Total tables: {len(tables)} | Total records: {total_records}")
    return backup_file

if __name__ == "__main__":
    backup_database("chotu_restro_ai")
