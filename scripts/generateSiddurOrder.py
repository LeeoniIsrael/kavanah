"""Keep section order from Sefaria's published schema; fail on missing catalog entries."""
import json
import urllib.request
import urllib.parse
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'src/data/generatedLiturgyIndex.json').read_text())
result = {}
for work in ['Siddur Ashkenaz', 'Siddur Sefard', 'Siddur Edot HaMizrach']:
    with urllib.request.urlopen('https://www.sefaria.org/api/v2/index/' + urllib.parse.quote(work), timeout=30) as response:
        schema = json.load(response)['schema']
    entries = {tuple(entry['path']): entry['id'] for entry in manifest['entries'] if entry['work'] == work}
    ordered = []
    def walk(node, path):
        title = next((title['text'] for title in node.get('titles', []) if title.get('lang') == 'en' and title.get('primary')), node.get('key', ''))
        current = path + ([] if node.get('default') else [title])
        if node.get('nodes'):
            for child in node['nodes']:
                walk(child, current)
        elif tuple(current) in entries:
            ordered.append(entries[tuple(current)])
    for node in schema['nodes']:
        walk(node, [])
    unique = list(dict.fromkeys(ordered))
    if set(unique) != set(entries.values()):
        raise RuntimeError(f'{work}: catalog and source schema differ; review before publishing')
    result[work] = unique
(root / 'src/data/siddurOrder.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
