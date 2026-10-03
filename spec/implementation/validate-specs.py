#!/usr/bin/env python3
"""Validate specification structure and local links; does not validate runtime behavior.

Run from any directory: python3 /path/to/spec/implementation/validate-specs.py
Uses only repository files and Python's standard library; no home configuration,
provider access, model calls, writes or external network lookups.
"""
from pathlib import Path
import hashlib, json, re

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root/'implementation/dependencies.json').read_text())
nodes = {n['id']: n for n in manifest['nodes']}
order = manifest['recommended_order']
assert len(nodes) == len(order) == len(set(order))
assert set(order) == set(nodes)
positions = {n:i for i,n in enumerate(order)}
for n in nodes.values():
    assert (root/n['path']).is_file(), n['path']
    assert len(n['requires']) == len(set(n['requires']))
    for dependency in n['requires']:
        assert dependency in nodes and positions[dependency] < positions[n['id']], (n['id'], dependency)
edge_count = sum(len(n['requires']) for n in nodes.values())
grouped = [c for group in manifest['delivery_groups'] for c in group['children']]
assert grouped == order

source_path = root/'implementation/reference/SPEC.md'
source_lines = source_path.read_text().splitlines()
table_headers = set()
for i,line in enumerate(source_lines):
    if line.startswith('|') and re.fullmatch(r'[| :\-]+', line):
        table_headers.update((i-1,i))
units = {i+1:line for i,line in enumerate(source_lines)
         if line.strip() and not line.startswith('#') and i not in table_headers}
trace = (root/'TRACEABILITY.md').read_text()
rows = re.findall(r'^\| (R\d{3}) \| (.*?) \| (L\d+:.*?) \| (.*?) \| (.*?) \|$', trace, re.M)
ids = [r[0] for r in rows]
assert len(ids) == len(set(ids)) == len(units)
assert set(ids) == {f'R{i:03}' for i in range(1,len(ids)+1)}
covered = []
for ident,section,locator,owners,target in rows:
    line_number = int(re.match(r'L(\d+):',locator)[1]); covered.append(line_number)
    text = re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',units[line_number]).replace('**','').replace('`','')
    if text.startswith('|'):
        text = ' / '.join(s.strip() for s in text.strip('|').split('|'))
    text = ' '.join(text.split())
    excerpt = locator.split(': ',1)[1].removesuffix('…')
    assert text.startswith(excerpt), (ident,line_number)
    assert re.search(r'\[M\d{2}\]',owners)
    assert f'CHILD-TEST-MAP.md#{ident.lower()}' in target
assert covered == sorted(units)
assert hashlib.sha256(source_path.read_bytes()).hexdigest() in trace

mapping = (root/'implementation/CHILD-TEST-MAP.md').read_text()
allocations = re.findall(r'^\| <a id="(r\d+)"></a>(R\d+) \| (.*?) \| (.*?) \|$',mapping,re.M)
assert [r[1] for r in allocations] == ids
allocated = set()
for anchor,ident,children,status in allocations:
    assert anchor == ident.lower()
    cs = re.findall(r'\[(M\d+\.\d+)\]',children)
    assert len(cs) == len(set(cs))
    assert set(cs) <= set(nodes)
    if ident not in ('R001','R003'):
        assert cs and 'PLANNED' in status
    allocated.update(cs)
assert allocated == set(nodes)-{'Bootstrap'}
test_rows = re.findall(r'^\| <a id="(m\d+-\d+)"></a>\[(M\d+\.\d+) — .*?\]\(([^)]+)\) \| (.*?) \| (.*?) \|$',mapping,re.M)
assert len(test_rows) == len(nodes)-1
assert {r[1] for r in test_rows} == set(nodes)-{'Bootstrap'}
assert {p.name for p in root.iterdir()} == {'README.md','ARCHITECTURE.md','TRACEABILITY.md','implementation'}
# Supplemental allocations must be visible in each bounded child, including ranges.
# This is a documentation coverage check, not semantic or runtime verification.
missing_supplement_refs = []
for anchor, ident, children, status in allocations:
    if int(ident[1:]) < 161:
        continue
    for child in re.findall(r'\[(M\d+\.\d+)\]', children):
        declared = set()
        for first, last in re.findall(r'\bR(\d{3})(?:\s*[–-]\s*R?(\d{3}))?', (root/nodes[child]['path']).read_text()):
            declared.update(f'R{i:03}' for i in range(int(first), int(last or first)+1))
        if ident not in declared:
            missing_supplement_refs.append((ident, child))
if '--require-supplement-coverage' in __import__('sys').argv:
    assert not missing_supplement_refs, missing_supplement_refs
    print('PASS: every allocated supplemental requirement is cited by its implementation child.')

print(f'PASS: {len(ids)} source units, current digest/locators and complete child allocations.')
print(f'PASS: {len(nodes)-1} child/test rows, {len(nodes)} acyclic graph nodes and {edge_count} prerequisite edges.')
print('PASS: required four-entry specification layout preserved.')

from pathlib import Path
import re,sys
from urllib.parse import unquote,urlsplit
root=Path(__file__).resolve().parents[2]
errors=[];count=0
cache={}
def anchors(path):
    if path in cache:return cache[path]
    text=path.read_text(); ids=set(re.findall(r'\bid=[\"\x27]([^\"\x27]+)',text)); seen={}
    if path.suffix=='.md':
        fence=False
        for line in text.splitlines():
            if line.lstrip().startswith(('```','~~~')):fence=not fence;continue
            if fence:continue
            m=re.match(r'^#{1,6}\s+(.+?)\s*#*$',line)
            if not m:continue
            name=re.sub(r'<[^>]+>','',m.group(1)).lower()
            name=re.sub(r'[^\w\-\s]','',name).replace(' ','-')
            n=seen.get(name,0);seen[name]=n+1
            ids.add(name+(f'-{n}' if n else ''))
    cache[path]=ids;return ids
for path in sorted(root.rglob('*.md')):
    if any(part.startswith('.') for part in path.relative_to(root).parts):continue
    text=re.sub(r'(?ms)^```.*?^```\s*$','',path.read_text())
    for target in re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)',text):
        target=target.strip().strip('<>')
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target):continue
        target=target.split(' "')[0]
        url=urlsplit(target); local=unquote(url.path)
        dest=(path.parent/local).resolve() if local else path
        count+=1
        if not dest.exists():errors.append(f'{path.relative_to(root)}: missing {target}')
        elif url.fragment and dest.is_file() and dest.suffix in ('.md','.html'):
            if unquote(url.fragment) not in anchors(dest):errors.append(f'{path.relative_to(root)}: missing anchor {target}')
print(f'Checked {count} local repository Markdown links')
if errors:print('\n'.join(errors));sys.exit(1)
print('PASS: all local paths and Markdown/HTML anchors resolve')
