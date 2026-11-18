'use strict';
// IVCAD 2026 — recorte estadual de Pernambuco, fonte pública agregada MDS / SEPLAG-PE.
// Não é uma base nacional; outros estados devem retornar null.
// Origem: Portal de Dados Abertos de Pernambuco, extração secundária sem alterar valores.
const zlib=require('node:zlib');
const encoded=require('./snapshot');
const records=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'));
const SOURCE=Object.freeze({
 source:'SEPLAG-PE / Condepe-Fidem (dados originais MDS)',
 year:'2026',
 url:'https://www.dados.pe.gov.br/pt_BR/dataset/indice-de-vulnerabilidade-do-cadastro-unico-ivcad-pernambuco',
 csv:'https://dados.pe.gov.br/dataset/2d11e686-1e8e-4d10-9cac-33d24b9d9e1f/resource/4e5a53bc-7348-4f1c-9ef1-816e12ef9662/download/ivcad_pe_municipios.csv',
 dashboard:'https://www.cf.pe.gov.br/observatorio/fontes/seplag_ivcad',
 sha256:'cbe89ca8965dbf3c04054a1e503d98011aa9c0d4813026b351e205d994b603cd',
 publication:'2026-09-14',
 retrieved:'2026-11-18',
 coverage:'185 municípios/distrito estadualizados em PE',
 caution:'IVCAD vale de 0 a 1 e tem 6 dimensões. Não equivale a percentual de famílias vulneráveis nem cobertura integral do Cadastro Único. Famílias/pessoas correspondem ao universo do recorte da extração.'
});
if(Object.keys(records).length!==185)throw Error('IVCAD/PE: snapshot incompleto; bloquear leitura.');
function getByMunicipio(code){
 const k=String(code||'');
 if(!/^26\d{5}$/.test(k))return null;
 const v=records[k];
 if(!Array.isArray(v)||v.length!==9)return null;
 const [familias,pessoas,geral,nc,dpi,dca,tqa,dr,ch]=v;
 if(!Number.isSafeInteger(familias)||!Number.isSafeInteger(pessoas)||familias<=0||pessoas<familias)return null;
 const dimension=[geral,nc,dpi,dca,tqa,dr,ch];
 if(!dimension.every(x=>Number.isFinite(x)&&x>=0&&x<=1))return null;
 if(Math.abs(geral-(nc+dpi+dca+tqa+dr+ch)/6)>0.0001)return null;
 return {familias,pessoas,geral,nc,dpi,dca,tqa,dr,ch};
}
module.exports={getByMunicipio,SOURCE};
