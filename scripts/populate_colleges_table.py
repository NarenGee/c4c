#!/usr/bin/env python3
"""
Script to populate the colleges table with data from colleges_name_country_domain.csv
This script reads the CSV file and inserts the data into the Supabase colleges table.
"""

import csv
import os
import sys
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local in parent directory
load_dotenv('../.env.local')

def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin operations
    
    if not url or not key:
        print("Error: Missing Supabase environment variables")
        print("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
        print(f"URL found: {url is not None}")
        print(f"Key found: {key is not None}")
        sys.exit(1)
    
    return create_client(url, key)

def populate_colleges_table():
    """Populate the colleges table with data from the CSV file."""
    supabase = get_supabase_client()
    
    # Path to the CSV file
    csv_path = "../colleges_name_country_domain.csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    
    print("Starting to populate colleges table...")
    
    # First, clear existing data (optional - comment out if you want to keep existing data)
    print("Clearing existing colleges data...")
    try:
        result = supabase.table("colleges").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"Cleared {len(result.data) if result.data else 0} existing records")
    except Exception as e:
        print(f"Warning: Could not clear existing data: {e}")
    
    # Read and insert CSV data
    inserted_count = 0
    error_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Prepare the data with a generated UUID
                college_data = {
                    "id": str(uuid.uuid4()),  # Generate a unique UUID for each college
                    "name": row["name"].strip(),
                    "country": row["country"].strip(),
                    "domain": row["domain"].strip() if row["domain"] else None
                }
                
                # Skip rows with empty names or countries
                if not college_data["name"] or not college_data["country"]:
                    continue
                
                # Insert the college data
                result = supabase.table("colleges").insert(college_data).execute()
                
                if result.data:
                    inserted_count += 1
                    if inserted_count % 100 == 0:
                        print(f"Inserted {inserted_count} colleges...")
                else:
                    error_count += 1
                    print(f"Error inserting row {row_num}: {college_data}")
                    
            except Exception as e:
                error_count += 1
                print(f"Error processing row {row_num}: {e}")
                continue
    
    print(f"\nPopulation complete!")
    print(f"Successfully inserted: {inserted_count} colleges")
    print(f"Errors: {error_count}")
    
    # Verify the data
    try:
        result = supabase.table("colleges").select("id", count="exact").execute()
        total_count = result.count if result.count else 0
        print(f"Total colleges in database: {total_count}")
    except Exception as e:
        print(f"Could not verify final count: {e}")

if __name__ == "__main__":
    populate_colleges_table()
