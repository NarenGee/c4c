import json
import csv

INPUT = 'colleges_with_domain.json'
OUTPUT = 'colleges_name_country_domain.csv'

with open(INPUT, encoding='utf-8') as f:
    data = json.load(f)

with open(OUTPUT, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['name', 'country', 'domain'])
    for u in data:
        writer.writerow([
            u.get('name', ''),
            u.get('country', ''),
            u.get('domain', '')
        ]) 