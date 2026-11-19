'use strict';
// Histórico nacional municipal UFMG / OBPopRua, origem Cadastro Único, 2012–2021.
// Ausência do código em um ano NÃO indica valor zero: planilhas listam observações
// agregadas identificadas. A série não é Censo e não reflete o ano atual.
let snapshot=null;
try{snapshot=require('../data/poprua-ufmg-2012-2021.json')}catch(_){/* dados ainda não materializados */}
function byMunicipio(code,year=2021){
 const ibge=String(code),yr=String(year);
 if(!/^\d{7}$/.test(ibge)||!/^(201[2-9]|202[0-1])$/.test(yr)||!snapshot)return null;
 const entry=snapshot?.municipalities?.[ibge];
 if(!entry||!Object.hasOwn(entry,yr))return null;
 const value=entry[yr];
 if(!Number.isSafeInteger(value)||value<1)return null;
 return {value,year:Number(yr),unit:'pessoas cadastradas em situação de rua',
  source:snapshot.source,originalSource:snapshot.originalSource,sourceUrl:snapshot.sourceUrl,
  sha256:snapshot.sha256Serie,
  warning:snapshot.warning};
}
const provenance=()=>snapshot?{
 source:snapshot.source,sourceUrl:snapshot.sourceUrl,
 period:'2012–2021',sha256Serie:snapshot.sha256Serie,sha2562021:snapshot.sha2562021,
 municipalities2021:snapshot.observedMunicipalities2021,
 observedMunicipalities:snapshot.observedMunicipalities,
 caveat:snapshot.warning
}:null;
module.exports={byMunicipio,provenance};
