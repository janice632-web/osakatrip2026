from pathlib import Path
import json,sys
base=Path(__file__).resolve().parents[1]
trip=json.loads((base/'public/data/osaka-2026.json').read_text(encoding='utf-8'))
errors=[]
days=trip.get('days',[])
if [d.get('day') for d in days] != [1,2,3,4,5,6]: errors.append('Day 1～Day 6 不完整')
def items(d):
 r=list(d.get('items',[]))
 for p in d.get('plans',[]): r+=p.get('items',[])
 return r
titles=[i.get('title','') for d in days for i in items(d)]
for x in ['飯店 Check-in','大阪城 Road Train','讀賣電視台','HARUKAS 300','名偵探柯南 4-D Live Show','Nintendo OSAKA','BR175 神戶起飛']:
 if x not in titles: errors.append('缺少：'+x)
d6=next((d for d in days if d.get('day')==6),{})
pn=[p.get('name','') for p in d6.get('plans',[])]
if not any('Plan A' in x for x in pn): errors.append('Day 6 缺 Plan A')
if not any('Plan B' in x for x in pn): errors.append('Day 6 缺 Plan B')
for d in days:
 if not d.get('weather'): errors.append(f"Day {d.get('day')} 缺天氣")
if errors:
 print('FAILED')
 [print('-',e) for e in errors]
 sys.exit(1)
print('PASS：核心旅程資料完整')
