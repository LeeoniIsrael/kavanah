#!/usr/bin/env python3
"""Deterministic, offline import of the captured research. Publication is not expert approval."""
import collections, gzip, hashlib, json, pathlib, re, unicodedata
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/research/prayer-dictionary/data'
OUT = ROOT / 'src/data'
DATE = '2026-09-27T00:00:00.000Z'
def load(name): return json.loads((DATA/name).read_text())
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
def slug(s): return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',s.lower())).strip('-')
def clean(s): return re.sub(r'\s+',' ',s.replace('\u200d','').replace('\u200c','')).strip()
editions={e['id']:e for e in load('editions.json')}
# Explicit continuity mappings replace old wording with the named research section.
preferred={
 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani':'modeh-ani',
 'Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar':'asher-yatzar',
 'Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema':'shema',
}
aliases={'modeh-ani':['wake up','morning gratitude'], 'asher-yatzar':['bathroom','wellness'], 'shema':['shema yisrael','hear israel','adonai echad']}
category_map={'gratitude':'thanks','wellness':'health','healing':'health','opportunity':'success','livelihood':'success','provision':'success','learning':'study','wisdom':'study','grief':'mourning','comfort':'mourning','anxiety':'protection','peace':'safety'}
categories=set('daily tefillin food safety health thanks success study protection travel shabbat holiday mourning sleep repentance nation source'.split())
entries=[];excluded=[];redirects={}
def version(e):return {k:e.get(k,e.get('language','')) for k in ['versionTitle','language','actualLanguage','license','versionSource']}
def make(id,ref,title,buckets,work,path,tradition,htitle,hver,ever,tokens,kind,summary,researchid):
 tags=list(dict.fromkeys(buckets+[category_map.get(b,b) for b in buckets]))
 if 'health' in tags:tags+=['healing','wellness','recovery']
 if 'success' in tags:tags+=['opportunity','livelihood','work']
 entry=dict(id=id,title=title,sefariaRef=ref,category=next((x for x in tags if x in categories),'source'),summary=summary,useCase=f'{summary} Themes: {", ".join(buckets)}. Follow your community’s practice.',aliases=[htitle,*aliases.get(id,[]),*buckets],tags=list(dict.fromkeys(tags)),tokens=tokens,source='local-cache',updatedAt=DATE,
  hebrewReview=dict(contentKind=kind,status='pending',tradition=tradition,sourceTitle=work,sourceRef=ref,sourceUrl='https://www.sefaria.org/'+ref.replace(' ','_'),licenseStatus='verification-required',notes='Captured source editions; Hebrew/English alignment and machine pronunciation await expert review. Inclusion was requested by the app owner; it is not rabbinic approval.'),
  sourceMetadata=dict(work=work,categories=['Tanakh' if tradition=='scriptural' else 'Liturgy'],path=path,hebrewTitle=htitle,sourceVersion=version(hver),translationVersions=[version(ever)]),
  research=dict(id=researchid,pronunciationStatus='machine-draft-unreviewed',alignmentStatus='source-address-matched-unreviewed'))
 entries.append(entry)
 return entry
for p in load('psalms.json'):
 he=next(e for e in editions.values() if e['work']=='Psalms' and e['versionTitle']=='Tanach with Nikkud')
 en=next(e for e in editions.values() if e['work']=='Psalms' and e['language']=='en')
 id=f"sefaria-psalms-{p['number']}"
 tokens=[dict(id=f"{id}-{v['verse']}",hebrew=v['hebrew'],translation=v['english'],transliteration=clean(v['transliteration'])) for v in p['verses']]
 assert all(t['hebrew'] and t['translation'] and t['transliteration'] for t in tokens)
 make(id,f"Psalms {p['number']}",p['title'],p['buckets'],'Psalms',[str(p['number'])],'scriptural','',he,en,tokens,'complete',p['theme'],p['id'])
for line in gzip.open(DATA/'liturgy-corpus.jsonl.gz','rt'):
 r=json.loads(line); h=(r['hebrew'] or {}).get('segments',[]); e=(r['english'] or {}).get('segments',[])
 reason=None
 if not h or not e:reason='Missing Hebrew or English'
 elif [s['address'] for s in h]!=[s['address'] for s in e]:reason='Hebrew and English source addresses differ'
 tokens=[];id=preferred.get(r['ref'],'sefaria-'+slug(r['ref']))
 if not reason:
  for hs,es in zip(h,e):
   tr=hs.get('transliterationDraft',{}).get('text')
   # A wholly unpointed small-print source block is a rubric, never words to recite.
   instruction=not tr and bool(re.fullmatch(r'\s*<small>.*</small>\s*',hs['sourceText'],re.S)) and not re.search('[\u05b0-\u05bb\u05c7]',hs['text'])
   if r['ref']=='Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema' and hs['address']==[9]:instruction=True  # Explicit direction quoting the words it connects.
   if not tr and not instruction:reason='Unresolved pronunciation or mixed instruction/text';break
   if not clean(es['text']):reason='Empty English';break
   tokens.append(dict(id=id+'-'+'.'.join(map(str,hs['address'])),hebrew=hs['text'],translation=es['text'],transliteration=clean(tr or ''),**({'kind':'instruction'} if instruction else {})))
 if not reason and not any(t.get('kind')!='instruction' for t in tokens):reason='Instructions only'
 if reason:excluded.append(dict(id=r['id'],ref=r['ref'],reason=reason));continue
 make(id,r['ref'],r['title'],r['buckets'],r['work'],r['path'],r['tradition'],r['hebrewTitle'],editions[r['hebrew']['editionId']],editions[r['english']['editionId']],tokens,'remote-unreviewed',f"{r['title']} · {r['work']}",r['id'])
 if r['ref'] in preferred:redirects['sefaria-'+slug(r['ref'])]=id
for b in load('biblical-prayers.json'):
 he=next(v for v in b['versions'] if v['language']=='he');en=next(v for v in b['versions'] if v['language']=='en')
 def flatten(x):return sum((flatten(y) for y in x),[]) if isinstance(x,list) else [x]
 hs=flatten(he['text']);es=flatten(en['text']);ps=b['pronunciationSegments'];id='research-'+slug(b['ref'])
 if len(hs)!=len(es) or len(hs)!=len(ps) or not all(s['transliterationDraft'].get('text') for s in ps):
  excluded.append(dict(id=id,ref=b['ref'],reason='Biblical alignment or pronunciation incomplete'));continue
 tokens=[dict(id=f'{id}-{i+1}',hebrew=h,translation=e,transliteration=clean(p['transliterationDraft']['text'])) for i,(h,e,p) in enumerate(zip(hs,es,ps))]
 make(id,b['ref'],b['title'],b['buckets'],b['ref'].split(' ')[0],[], 'scriptural','',he,en,tokens,'excerpt',b['title'],id)
from importPracticeGuides import add_practice_guides
add_practice_guides(DATA, entries, make, editions, clean)
redirects["tefillin-blessing"] = "tefillin"
# Stable default and prominent daily entries, followed by the complete Psalter and source order.
entries.sort(key=lambda p: (0 if p['id']=='modeh-ani' else 1 if p['id']=='shema' else 2 if p['id']=='asher-yatzar' else 3))
assert len({p['id'] for p in entries})==len(entries)
from readableTransliteration import apply_readable_transliteration
apply_readable_transliteration(entries)
write(OUT/'researchPrayers.json',entries)
index=[]
for p in entries:
 m=p['sourceMetadata'];index.append(dict(id=p['id'],title=p['title'],hebrewTitle=m['hebrewTitle'],ref=p['sefariaRef'],work=m['work'],categories=m['categories'],path=m['path'],tradition=p['hebrewReview']['tradition'],aliases=p['aliases'],tags=p['tags'],summary=p['summary'],useCase=p['useCase'],sourceVersion=m['sourceVersion'],translationVersions=m['translationVersions']))
write(OUT/'generatedLiturgyIndex.json',dict(generatedAt=DATE,sourceApi='offline-research-snapshot',sourceCatalog='docs/research/prayer-dictionary',workCount=len({p['work'] for p in index}),entryCount=len(index),languages=['he','en'],excludedWorks=[],entries=index))
write(OUT/'siddurOrder.json',{book:[p['id'] for p in index if p['work']==book] for book in ['Siddur Ashkenaz','Siddur Sefard','Siddur Edot HaMizrach']})
write(OUT/'researchPrayerRedirects.json',redirects)
write(DATA/'app-import-report.json',dict(publicationBasis='User requested research-only app catalog; expert approval is not asserted',entryCount=len(entries),psalms=150,biblicalPassages=sum(p['id'].startswith('research-') for p in entries),liturgySections=sum(p['research']['id'].startswith('lit-') for p in entries),excluded=excluded,sha256=hashlib.sha256((OUT/'researchPrayers.json').read_bytes()).hexdigest()))
print('Imported',len(entries),'entries;',len(excluded),'excluded; bytes:',(OUT/'researchPrayers.json').stat().st_size)
