#!/usr/bin/env python3
"""Produce 2025 municipal aggregates from the public INEP Censo Escolar school-level CSV.
No school-specific or pupil-level records are stored in the project.
Input ZIP MUST have independently verified SHA256 BEFORE calling this script.
"""
import csv, io, json, sys, zipfile
from collections import defaultdict
from pathlib import Path

FIELDS = ['QT_MAT_BAS','QT_MAT_EJA','QT_MAT_PROF','QT_MAT_ESP','QT_MAT_ESP_CC','QT_MAT_ESP_CE','QT_MAT_PROF_TEC','QT_MAT_EJA_FUND','QT_MAT_EJA_MED']
FIELDS = tuple(FIELDS)
ZIP = Path(sys.argv[1])
with zipfile.ZipFile(ZIP) as z:
    names = z.namelist()
    available = [n for n in names if n.lower().endswith('.csv')]
    print('INEP_ZIP_CONTENTS', json.dumps([{"name":n,"bytes":z.getinfo(n).file_size} for n in available[:30]], ensure_ascii=False))
    candidates = [n for n in available if 'tabela_matricula_2025' in n.lower()]
    if len(candidates) != 1:
        raise ValueError("Expected exactly one official school enrollment CSV, found: "+str(candidates))
    name = candidates[0]
    with z.open(name) as binary:
        sample = binary.read(10000)
        sample_ascii = sample.decode('utf-8-sig',errors='replace')
        head = sample_ascii.splitlines()[0].strip()
        sep = ';' if head.count(';') > head.count(',') else ','
    header = next(csv.reader([head],delimiter=sep))
    header = [c.replace('\ufeff','').strip().upper() for c in header]
    print('INEP_CSV_HEADER',json.dumps(header,ensure_ascii=False))
    needed = ['CO_MUNICIPIO'] + list(FIELDS)
    missing = [field for field in needed if field not in header]
    if missing:
        raise ValueError('Official CSV does not include required fields: '+str(missing))
    by_muni=defaultdict(lambda: [0]*len(FIELDS))
    n=0
    with z.open(name) as binary:
        with io.TextIOWrapper(binary,encoding='utf-8-sig',errors='replace',newline='') as src:
            reader=csv.DictReader(src,delimiter=sep)
            for row in reader:
                n+=1
                if n>350000: raise ValueError('CSV row count exceeds expected size')
                code = (row.get('CO_MUNICIPIO') or '').strip()
                if not (len(code)==7 and code.isdecimal()): raise ValueError('Invalid municipality code at row '+str(n))
                values=by_muni[code]
                for i,field in enumerate(FIELDS):
                    raw=(row.get(field) or '').strip()
                    if raw in ['','-','...','..']:
                        raise ValueError(f'Missing {field} at row {n}; cannot silently treat as zero')
                    try: num=int(raw)
                    except ValueError: raise ValueError(f'Bad {field} at row {n}: {raw[:45]}')
                    if num<0: raise ValueError('Negative count')
                    values[i]+=num
    if n<100000 or len(by_muni)<5550:
        raise ValueError(f'Insufficient school entries: {n} schools / {len(by_muni)} municipalities')
    base_total=sum(v[0] for v in by_muni.values())
    print('INEP_NATIONAL',json.dumps({"schools":n,"municipalities":len(by_muni),"basic_enrollments":base_total},ensure_ascii=False))
    # Official national Censo Escolar INEP 2025 reported basic school enrollments = 46,018,380.
    if base_total != 46018380:
        raise ValueError('National enrollment does not match official 2025 total; refuse to publish: '+str(base_total))
    output={'year':2025,'dataset':'INEP Censo Escolar 2025, microdados de estabelecimentos, Tabela Matricula',
            'source':'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip',
            'sha256':'ad2c389160be5cf6b8e32257677e9b5657f01d10a342355ad9757bfecd2fc90a',
            'rows':n,'municipalitiesCount':len(by_muni),'fields':list(FIELDS),
            'municipalities':dict(sorted(by_muni.items()))}
    Path('data').mkdir(exist_ok=True)
    target=Path('data/inep2025-municipal.json')
    target.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print('INEP_SNAPSHOT_OK',json.dumps({"bytes":target.stat().st_size,"bh":by_muni.get('3106200'),"neves":by_muni.get('3154606')},ensure_ascii=False))
