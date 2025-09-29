import json
import re

INPUT = r'C:/Users/naren/Downloads/world_universities_and_domains.json'
OUTPUT = 'colleges_with_domain.json'

def extract_domain(url):
    match = re.search(r'www\.([^.]+)\.', url)
    if match:
        return match.group(1)
    return None

def main():
    with open(INPUT, encoding='utf-8') as f:
        data = json.load(f)
    out = []
    for u in data:
        url = u['web_pages'][0] if u.get('web_pages') and len(u['web_pages']) > 0 else ''
        domain = extract_domain(url)
        u['domain'] = domain
        out.append(u)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main() 