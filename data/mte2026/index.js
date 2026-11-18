'use strict';
const zlib=require('node:zlib');
// Fonte MTE/SIT, Portal AFT. Competência julho/2026. Dados públicos agregados.
const blocks=[require('./part0'),require('./part1'),require('./part2'),require('./part3'),require('./part4')];
const b64=blocks.join('');
if(b64.length!==64644)throw Error('MTE 07/2026: arquivo parcial ou modificado.');
const records=JSON.parse(zlib.gunzipSync(Buffer.from(b64,'base64')).toString('utf8'));
if(Object.keys(records).length!==5518)throw Error('MTE 07/2026: contagem de municípios incorreta.');
const sectors=['Comércio','Serviços','Indústria','Agricultura','Transportes','Outros'];
const provenance=Object.freeze({
 competencia:'07/2026',
 dataPublicacaoConsultada:'18/11/2026',
 titulo:'Potencial da Cota de Aprendizes por UF, município e setor econômico',
 emissor:'Ministério do Trabalho e Emprego · Secretaria de Inspeção do Trabalho',
 url:'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/insercao-de-aprendiz-1/potencial_ead_julho-1.xlsx',
 sha256:'0801a87924d071355c0f31f80fe88237feb13df5b85c73abf2ec08d0ff4da3a9',
 municipiosValidados:5518,
 municipiosSemCorrespondenciaExata:52,
 nota:'Potencial da cota não corresponde a vagas anunciadas, oportunidades abertas nem contratações efetivadas. O recorte por setor representa distribuição do potencial informado pelo MTE.'
});
function getByMunicipio(code){
 const row=records[String(code)];
 if(!Array.isArray(row)||row.length!==7||!row.every(x=>Number.isInteger(x)&&x>=0)||row[0]!==row.slice(1).reduce((a,b)=>a+b,0))return null;
 return {total:row[0],setores:Object.fromEntries(sectors.map((s,i)=>[s,row[i+1]]))};
}
module.exports={getByMunicipio,provenance};
