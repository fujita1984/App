# -*- coding: utf-8 -*-
import pymysql
import csv
import os
import json
import platform

def load_db_config():
    """
    Load database configuration from appsettings.json based on OS
    Windows: appsettings.Development.json
    Ubuntu/Linux: appsettings.Production.json
    """
    # Detect OS
    system = platform.system()
    
    # Determine config file
    if system == 'Windows':
        config_file = 'appsettings.Development.json'
        env = 'Development'
    else:  # Linux/Ubuntu
        config_file = 'appsettings.Production.json'
        env = 'Production'
    
    print(f"Detected OS: {system} -> Using {env} environment")
    
    # Get script directory and project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    config_path = os.path.join(project_root, config_file)
    
    # Load JSON file
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Parse connection string
        conn_str = config['ConnectionStrings']['DefaultConnection']
        
        # Parse connection string to dict
        db_config = {}
        for item in conn_str.split(';'):
            if '=' in item:
                key, value = item.split('=', 1)
                key = key.strip().lower()
                value = value.strip()
                
                if key == 'server':
                    db_config['host'] = value
                elif key == 'database':
                    db_config['database'] = value
                elif key == 'user':
                    db_config['user'] = value
                elif key == 'password':
                    db_config['password'] = value
        
        db_config['charset'] = 'utf8mb4'
        
        print(f"Loaded config: {config_file}")
        print(f"  Host: {db_config['host']}")
        print(f"  Database: {db_config['database']}")
        print(f"  User: {db_config['user']}")
        
        return db_config
        
    except FileNotFoundError:
        print(f"Error: Config file not found: {config_path}")
        raise
    except Exception as e:
        print(f"Error loading config: {e}")
        raise

def import_csv_to_db(csv_file):
    """
    Delete all data from hsk_words table and import from CSV file
    
    Args:
        csv_file (str): CSV file path to import
    """
    connection = None
    try:
        # Load database config from appsettings.json
        db_config = load_db_config()
        
        connection = pymysql.connect(**db_config)
        print(f"Connected to database: {db_config['database']}")
        
        with connection.cursor() as cursor:
            # Step 1: Delete all existing data
            print("\nStep 1: Deleting existing data...")
            cursor.execute("DELETE FROM hsk_words")
            deleted_count = cursor.rowcount
            print(f"Deleted {deleted_count} records")
            
            # Step 2: Reset auto increment (optional)
            print("\nStep 2: Resetting auto increment...")
            cursor.execute("ALTER TABLE hsk_words AUTO_INCREMENT = 1")
            
            # Step 3: Read CSV and insert data
            print(f"\nStep 3: Importing data from {csv_file}...")
            
            insert_query = """
                INSERT INTO hsk_words 
                (Id, Chinese, Pinyin, Pinyin_With_Tone, Japanese_Meaning, Hsk_Level)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            inserted_count = 0
            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cursor.execute(insert_query, (
                        int(row['Id']),
                        row['Chinese'],
                        row['Pinyin'],
                        row['Pinyin_With_Tone'],
                        row['Japanese_Meaning'],
                        int(row['Hsk_Level'])
                    ))
                    inserted_count += 1
                    
                    # Progress indicator
                    if inserted_count % 100 == 0:
                        print(f"  Inserted {inserted_count} records...")
            
            # Commit all changes
            connection.commit()
            print(f"\nCompleted! Inserted {inserted_count} records successfully.")
            
            # Step 4: Verify data
            print("\nStep 4: Verifying data...")
            cursor.execute("SELECT COUNT(*) FROM hsk_words")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT Hsk_Level, COUNT(*) FROM hsk_words GROUP BY Hsk_Level ORDER BY Hsk_Level")
            level_counts = cursor.fetchall()
            
            print(f"Total records: {total}")
            print("\nRecords by HSK Level:")
            for level, count in level_counts:
                print(f"  HSK {level}: {count} words")
            
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file}' not found")
    except pymysql.Error as e:
        print(f"Database error: {e}")
        if connection:
            connection.rollback()
            print("Transaction rolled back")
    except Exception as e:
        print(f"Error occurred: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            connection.close()
            print("\nDatabase connection closed.")

def main():
    print("=" * 50)
    print("HSK Words CSV Import Script")
    print("=" * 50)
    
    csv_file = 'hsk_words_20260201_125927.csv'
    
    print(f"\nThis will:")
    print(f"  1. DELETE all existing data from hsk_words table")
    print(f"  2. Import data from: {csv_file}")
    
    confirm = input("\nProceed? (y/n): ")
    if confirm.lower() == 'y':
        import_csv_to_db(csv_file)
    else:
        print("Cancelled.")

if __name__ == '__main__':
    main()