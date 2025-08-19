#!/usr/bin/env python3
"""
Database migration script to handle LLM analysis fields
"""
import sqlite3
import os
from database import create_tables

def migrate_database():
    """Migrate database to add LLM analysis fields if they don't exist"""
    db_path = "pdrm_reports.db"
    
    if not os.path.exists(db_path):
        print("Database doesn't exist, creating new one...")
        create_tables()
        return
    
    print("Checking database schema...")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if LLM fields exist in insurance_analysis table
        cursor.execute("PRAGMA table_info(insurance_analysis)")
        columns = [column[1] for column in cursor.fetchall()]
        
        llm_fields = [
            'llm_confidence_score',
            'discrepancy_analysis', 
            'key_discrepancies',
            'consistency_assessment',
            'risk_factors',
            'supporting_evidence',
            'llm_recommendation'
        ]
        
        missing_fields = [field for field in llm_fields if field not in columns]
        
        if missing_fields:
            print(f"Adding missing LLM fields: {missing_fields}")
            
            # Add missing columns
            for field in missing_fields:
                if field == 'llm_confidence_score':
                    cursor.execute(f"ALTER TABLE insurance_analysis ADD COLUMN {field} REAL")
                else:
                    cursor.execute(f"ALTER TABLE insurance_analysis ADD COLUMN {field} TEXT")
                print(f"✅ Added column: {field}")
            
            conn.commit()
            print("✅ Database migration completed successfully")
        else:
            print("✅ Database schema is up to date")
            
    except sqlite3.Error as e:
        print(f"❌ Database migration failed: {e}")
        # If there's an error, recreate the tables
        print("Recreating database tables...")
        create_tables()
        
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()