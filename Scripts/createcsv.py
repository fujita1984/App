# -*- coding: utf-8 -*-
import pymysql
import csv
import os
import json
import platform
from datetime import datetime

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

def export_hsk_words_to_csv(output_file='hsk_words_export.csv'):
    """
    Export hsk_words table data to CSV file
    
    Args:
        output_file (str): Output CSV filename
    """
    connection = None
    try:
        # Load database config from appsettings.json
        db_config = load_db_config()
        
        # Connect to database
        connection = pymysql.connect(**db_config)
        print(f"Connected to database: {db_config['database']}")
        
        # Create cursor
        with connection.cursor() as cursor:
            # Get data from hsk_words table
            query = """
                SELECT Id, Chinese, Pinyin, Pinyin_With_Tone, 
                       Japanese_Meaning, Hsk_Level
                FROM hsk_words
                ORDER BY Id
            """
            cursor.execute(query)
            
            # Fetch all data
            rows = cursor.fetchall()
            
            if not rows:
                print("No data found.")
                return
            
            # Write to CSV file
            with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
                csv_writer = csv.writer(csvfile)
                
                # Write header row
                headers = ['Id', 'Chinese', 'Pinyin', 'Pinyin_With_Tone', 
                          'Japanese_Meaning', 'Hsk_Level']
                csv_writer.writerow(headers)
                
                # Write data rows
                csv_writer.writerows(rows)
            
            print(f"Exported {len(rows)} records to {output_file}")
            
    except pymysql.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        if connection:
            connection.close()
            print("Database connection closed.")

def main():
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'hsk_words_{timestamp}.csv'
    
    # Execute export
    export_hsk_words_to_csv(output_file)

if __name__ == '__main__':
    main()