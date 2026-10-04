#!/usr/bin/env python3
from pathlib import Path
import json,re,os
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'phases.json').read_text())
inputs=sorted(root.glob('[0-9][0-9]-*.md'))+[root/p['file'] for p in m['phases']]+[f for f in sorted((root/'templates').glob('*.md')) if f.name!='README.md']+[root/'SOURCES.md']
parts=['# Common Ground\n\n## End-to-end startup and hackathon plan\n\nPrepared 3 October 2026. Eight hypothetical weeks. All implementation phases remain planned. See README for navigation.\n']
for f in inputs:
 s=f.read_text()
 def repl(mt):
  label,target=mt.group(1),mt.group(2)
  if target.startswith(('http:','https:','mailto:','#')):return mt.group(0)
  return f'[{label}]({os.path.relpath((f.parent/target).resolve(),root.resolve())})'
 s=re.sub(r'\[([^\]]*)\]\(([^\s)]+)\)',repl,s)
 parts.append('\n---\n\n'+s)
(root/'MASTER-PLAN.md').write_text('\n'.join(parts))
print('Consolidated',len(inputs),'source files;',len((root/'MASTER-PLAN.md').read_text().split()),'words')
