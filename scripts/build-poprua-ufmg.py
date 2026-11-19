#!/usr/bin/env python3
"""Converte XLSX público OBPopRua/Polos-UFMG (CadÚnico histórico 2012–2021)
em AGREGADOS MUNICIPAIS, sem dados pessoais e sem imputar zeros ausentes.
Sem bibliotecas externas; apenas leitura do XML OOXML via zipfile.
"""
from __future__ import annotations
import hashlib,json,sys,zipfile
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

SOURCE='https://obpoprua.direito.ufmg.br/tabelas/municipios_serie_historica_pop_rua.xlsx'
CHECK_2021='https://obpoprua.direito.ufmg.br/tabelas/municipios_pop_rua_2021.xlsx'
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def rows(path):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            tree=ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared=[''.join(n.text or '' for n in node.iter() if n.tag.endswith('}t')) for node in tree.findall(NS+'si')]
        with z.open('xl/worksheets/sheet1.xml') as fp:
            for event,node in ET.iterparse(fp,events=('end',)):
                if node.tag!=NS+'row':
                    continue
                record={}
                for cell in node.findall(NS+'c'):
                    ref=cell.attrib.get('r','')
                    col=''.join(ch for ch in ref if ch.isalpha())
                    typ=cell.attrib.get('t','')
                    val=cell.find(NS+'v')
                    if val is not None:
                        value=val.text or ''
                        if typ=='s':value=shared[int(value)]
                    else:
                        inline=cell.find(NS+'is')
                        value=''.join(t.text or '' for t in inline.iter() if t.tag.endswith('}t')) if inline is not None else ''
                    record[col]=str(value).strip()
                yield record
                node.clear()

def integer(text,label):
    s=str(text)
    if not s.isdecimal(): raise ValueError('Não inteiro '+label+': '+repr(s))
    return int(s)

def main(serie,check):
    s=Path(serie);c=Path(check)
    if not s.is_file() or not c.is_file():raise ValueError('Ausência de XLSX oficial UFMG')
    result=defaultdict(dict);count=0
    for idx,row in enumerate(rows(s)):
        if idx==0:
            if not (row.get('B')=='codigo_ibg' and row.get('C')=='freq' and row.get('D')=='Ano'):
                raise ValueError('Cabeçalho inesperado da série histórica')
            continue
        code=row.get('B','');qty=integer(row.get('C',''),'freq');year=integer(row.get('D',''),'Ano')
        if len(code)!=7 or not code.isdecimal() or year<2012 or year>2021 or qty<1:
            raise ValueError('Registro inválido: '+str(row))
        if str(year) in result[code]:raise ValueError('Duplicidade: '+code+' '+str(year))
        result[code][str(year)]=qty;count+=1
    if len(result)<1200 or count<12000:
        raise ValueError('Cobertura histórica insuficiente: municípios='+str(len(result))+' registros='+str(count))
    check_codes=set()
    for idx,row in enumerate(rows(c)):
        if idx==0:
            if row.get('A')!='codigo_ibg' or row.get('B')!='freq':
                raise ValueError('Cabeçalho inesperado da conferência 2021')
            continue
        code=row.get('A','');qty=integer(row.get('B',''),'2021')
        if code in check_codes:raise ValueError('Município repetido na conferência 2021: '+code)
        if result.get(code,{}).get('2021')!=qty:
            raise ValueError('Divergência entre XLSX 2021 e série histórica: '+code)
        check_codes.add(code)
    series_codes={code for code,series in result.items() if '2021' in series}
    unconfirmed=sorted(series_codes-check_codes)
    if len(unconfirmed)>5 or len(check_codes)<900:
        raise ValueError('Cobertura 2021 não homologada '+str((len(check_codes),len(series_codes),unconfirmed[:15])))
    # As fontes originais divergem em até cinco chaves. Somente 2021 é removido
    # dos municípios não confirmados na conferência separada. Outros anos ficam.
    # Ausência NÃO é valor zero e nenhuma informação individual é guardada.
    for code in unconfirmed:
        del result[code]['2021']
    result={code:years for code,years in result.items() if years}
    n2021=len(check_codes)
    print('OBPOPRUA_CONCILIATION',json.dumps({'check2021':n2021,'serie2021':len(series_codes),
      'unconfirmed2021':unconfirmed},ensure_ascii=False))
    sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
    output={
      'source':'Observatório Brasileiro de Políticas Públicas com a População em Situação de Rua · Polos de Cidadania/UFMG',
      'originalSource':'Ministério da Cidadania / Cadastro Único, agregado e sistematizado pela UFMG',
      'sourceUrl':SOURCE,'checkUrl':CHECK_2021,
      'sha256Serie':sha(s),'sha2562021':sha(c),
      'startYear':2012,'endYear':2021,'observedMunicipalities':len(result),
      'observedMunicipalities2021':n2021,'observedRows':count-len(unconfirmed),'unconfirmed2021':unconfirmed,
      'warning':'Somente pessoas em situação de rua cadastradas no CadÚnico, NÃO população total. Ausência de registro municipal não é zero, e 2021 NÃO é dado atual.',
      'municipalities':dict(sorted(result.items()))
    }
    Path('data').mkdir(exist_ok=True)
    target=Path('data/poprua-ufmg-2012-2021.json')
    target.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print('OBPOPRUA_VALIDATED',json.dumps({'municipalities':len(result),'municipalities2021':n2021,'records':count,'bytes':target.stat().st_size,
     'sha256Serie':output['sha256Serie'],'sha2562021':output['sha2562021'],
     'bh':result.get('3106200',{}),'neves':result.get('3154606',{})},ensure_ascii=False))

if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('Uso: build-poprua-ufmg.py serie.xlsx 2021.xlsx')
    main(sys.argv[1],sys.argv[2])
