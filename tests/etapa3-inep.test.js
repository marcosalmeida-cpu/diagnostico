'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {parseSchoolResults,percentVariation,FIELDS}=require('../lib/censo-escolar-ibge');
function response(code='310620'){
 const v={infantil:[102857,107128],creche:[53082,54426],pre_escola:[49775,52702],fundamental:[252698,254943],medio:[83001,84654],
 docentes_infantil:[9120,9100],docentes_fundamental:[14374,14200],docentes_medio:[6944,7000],
 escolas_infantil:[943,941],escolas_creche:[874,873],escolas_pre_escola:[761,763],escolas_fundamental:[687,680],escolas_medio:[272,270]};
 return Object.entries(FIELDS).map(([name,id])=>({id:Number(id),res:[{localidade:code,res:{2025:String(v[name][0]),2024:String(v[name][1])}}]}));
}
test('INEP/IBGE 2025 preserva vínculo escolar local e valores inteiros',()=>{
 const data=parseSchoolResults(response(),'3106200');
 assert.equal(data.year,2025);
 assert.equal(data.fields.creche.current,53082);
 assert.equal(data.fields.medio.current,83001);
 assert.equal(data.fields.escolas_medio.current,272);
 assert.ok(percentVariation(data.fields.creche)<0);
});
test('INEP/IBGE nunca altera o município nem confunde ausência com zero',()=>{
 assert.equal(parseSchoolResults(response(),'3550308'),null);
 const invalid=response();invalid[0].res[0].res['2025']='1.000';
 assert.equal(invalid[0].res[0].res['2025'],'1.000');
 const parsed=parseSchoolResults(invalid,'3106200');
 assert.equal(parsed?.fields.infantil.current??null,null);
 const duplicate=response();duplicate.push(structuredClone(duplicate[0]));
 assert.equal(parseSchoolResults(duplicate,'3106200'),null);
 assert.equal(percentVariation({current:3,previous:0}),null);
});
