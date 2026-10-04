#!/usr/bin/env python3
"""Validate the planning package, not the future product or customer outcomes."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
errors=[]
def check(ok,msg):
 if not ok: errors.append(msg)
m=json.loads((root/'phases.json').read_text()); phases=m['phases']
check(len(phases)==32,'Expected 32 phases')
seen=set()
required=['## Global constraints','## Deliverables and interfaces','## Work steps','## Acceptance criteria','## CI and verification','## Evidence required for completion','## Risk, rollback and stop rule']
for p in phases:
 check(p['id'] not in seen,f"Duplicate {p['id']}")
 check(all(d in seen for d in p['depends_on']),f"Missing or forward dependency: {p['id']}")
 seen.add(p['id'])
 f=root/p['file'];check(f.exists(),f'Missing {f}')
 if not f.exists():continue
 s=f.read_text()
 for h in required: check(h in s,f'{p["id"]} missing {h}')
 check(len(p['ac'])>=3,f'{p["id"]} lacks specific AC')
 check(f"{p['hours']} founder hours" in s,f'{p["id"]} hours mismatch')
 check(all(x in s for x in p['ac']),f'{p["id"]} manifest/AC drift')
 check(p['status']=='planned',f'Planning package claims unverified completion: {p["id"]}')
check(sum(p['hours'] for p in phases)==192,'Hours do not sum192')
for w in range(1,9):check(sum(p['hours'] for p in phases if p['week']==w)==24,f'Week{w} allocation mismatch')
check(192+48==8*30,'Capacity mismatch')
weights=[15,15,10,10,10,10,10,10,5,5];scores=[5,3,6,8,7,5,4,2,3,3]
score=sum(w*s for w,s in zip(weights,scores))/100
check(score==4.7,'Score arithmetic mismatch')
check('**4.7**' in (root/'06-startup-score-and-validation.md').read_text(),'Rubric score mismatch')
files=list(root.rglob('*.md'))
for f in files:
 s=f.read_text(); s=re.sub(r'```.*?```','',s,flags=re.S)
 check('cite' not in s,f'Internal citation marker: {f}')
 for target in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',s):
  if target.startswith(('http:','https:','mailto:','#')):continue
  target=target.split('#',1)[0]
  if not target:continue
  check((f.parent/target).exists(),f'Broken local link in {f.relative_to(root)}: {target}')
 check(not re.search(r'(?i)\b(?:TBD|TODO|lorem ipsum)\b',s),f'Unresolved placeholder: {f.relative_to(root)}')
print(json.dumps({'result':'FAIL' if errors else 'PASS','phases':len(phases),'planned_hours':192,'contingency_hours':48,'weekly_hours':30,'startup_score':score,'markdown_files_checked':len(files),'errors':errors},indent=2))
sys.exit(bool(errors))
