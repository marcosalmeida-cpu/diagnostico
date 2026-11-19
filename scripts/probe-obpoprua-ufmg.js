'use strict';
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const candidates=[
 ['serie','https://obpoprua.direito.ufmg.br/tabelas/municipios_serie_historica_pop_rua.xlsx'],
 ['2021','https://obpoprua.direito.ufmg.br/tabelas/municipios_pop_rua_2021.xlsx']
];
async function download([name,url]){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(18000)});
  const length=Number(response.headers.get('content-length')),type=response.headers.get('content-type');
  const data=Buffer.from(await response.arrayBuffer());
  console.log('OBPOPRUA_FILE',JSON.stringify({name,status:response.status,type,length,received:data.length,signature:data.subarray(0,8).toString('hex')}));
  if(response.ok&&data.subarray(0,2).toString()==='PK'&&data.length<20000000){
   const path='/tmp/obpoprua-'+name+'.xlsx';fs.writeFileSync(path,data);
   const py=`import zipfile,sys,xml.etree.ElementTree as ET,json
p=sys.argv[1]
with zipfile.ZipFile(p) as z:
 print('SHEETS',len(z.namelist()),[x for x in z.namelist() if x.startswith('xl/worksheets/sheet')][:8])
 s=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  rt=ET.fromstring(z.read('xl/sharedStrings.xml'))
  s=[''.join(t.text or '' for t in row.iter() if t.tag.endswith('}t')) for row in rt]
 name='xl/worksheets/sheet1.xml'
 r=ET.fromstring(z.read(name))
 ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 sample=[]
 for row in r.findall('.//m:sheetData/m:row',ns)[:9]:
  out=[]
  for c in row.findall('m:c',ns):
   v=c.find('m:v',ns)
   ii=c.find('m:is',ns)
   value=v.text if v is not None else ''.join(t.text or '' for t in ii.iter() if t.tag.endswith('}t')) if ii is not None else ''
   if c.attrib.get('t')=='s' and value is not None: value=s[int(value)]
   out.append([c.attrib.get('r'),str(value)[:140]])
  sample.append(out)
 print('OBPOPRUA_SHEET_SAMPLE',json.dumps({'name':p,'rows':sample},ensure_ascii=False))
`;
   const pr=spawnSync('python3',['-c',py,path],{encoding:'utf8',timeout:20000});console.log(pr.stdout||pr.stderr);
  }
 }catch(e){console.log('OBPOPRUA_ERROR',name,e.message)}
}
Promise.all(candidates.map(download));
