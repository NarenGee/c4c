import json
import csv
import uuid

INPUT = 'colleges_with_domain.json'
OUTPUT = 'colleges_id_name_country_domain.csv'

with open(INPUT, encoding='utf-8') as f:
    data = json.load(f)

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'name', 'country', 'domain'])
    for u in data:
        writer.writerow([
            str(uuid.uuid4()),
            u.get('name', ''),
            u.get('country', ''),
            u.get('domain', '')
        ]) 