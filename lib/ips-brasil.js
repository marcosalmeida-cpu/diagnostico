'use strict';
// Snapshot reproduzido de fonte secundária independente, não de API oficial IPS.
// Cada código é associado ao cadastro oficial IBGE antes de entrar no repositório.
let DATA=null;
try{DATA=require('../data/ips2026-snapshot.json');}catch(_){/* dados não gerados */ }
const IDS=[
'ips_2026_geral','ips_2026_necessidades','ips_2026_bem_estar','ips_2026_oportunidades',
'ips_2026_nutricao','ips_2026_agua_saneamento','ips_2026_moradia','ips_2026_seguranca',
'ips_2026_conhecimento','ips_2026_informacao','ips_2026_saude','ips_2026_meio_ambiente',
'ips_2026_direitos','ips_2026_liberdade','ips_2026_inclusao','ips_2026_educacao_superior'
];
function getIps2026(code){
 if(!DATA||DATA.year!==2026||DATA.reference!=='IPS Brasil 2026'||DATA.count!==5570||!Array.isArray(DATA.fields)||DATA.fields.length!==IDS.length||!/^[0-9]{7}$/.test(String(code)))return null;
 const values=DATA.municipalities?.[code];
 if(!Array.isArray(values)||values.length!==IDS.length)return null;
 if(values.some(x=>x!==null&&(!Number.isFinite(x)||x<0||x>100)))return null;
 return {period:'2026',provenance:'espelho independente',scores:Object.fromEntries(IDS.map((id,i)=>[id,values[i]]))};
}
module.exports={getIps2026,IDS};
