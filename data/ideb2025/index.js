'use strict';
const zlib=require('node:zlib');

// Dados agregados municipais oficiais do INEP/IDEB 2025, rede Pública.
// Valores ausentes no arquivo de origem permanecem null.
// SHA256 dos ZIPs oficiais foi verificado na extração.
const parts=[require('./part0'),require('./part1'),require('./part2'),require('./part3')];
const base64=parts.join('');
if(base64.length!==37956)throw new Error('IDEB 2025: snapshot com tamanho incompatível.');
const data=JSON.parse(zlib.gunzipSync(Buffer.from(base64,'base64')).toString('utf8'));
if(Object.keys(data).length!==5545)throw new Error('IDEB 2025: contagem municipal não confere.');
const provenance=Object.freeze({
  ano:2025,rede:'Pública',
  etapas:['Ensino fundamental: anos iniciais','Ensino fundamental: anos finais'],
  urlIniciais:'https://download.inep.gov.br/ideb/resultados/divulgacao_anos_iniciais_municipios_2025.zip',
  urlFinais:'https://download.inep.gov.br/ideb/resultados/divulgacao_anos_finais_municipios_2025.zip',
  sha256Iniciais:'89100286327ab07a4b1318ba51974d62da90af334f663bedf6374cb67298a3e7',
  sha256Finais:'5f81ae18d33567608f10551d4f563a6879afc0182ff28cfd81e913958a30a6b3',
  municipiosComAlgumResultado:5545,registrosIniciais:5478,registrosFinais:5491
});
function getByMunicipio(codigo){
 const values=data[String(codigo)]||[];
 const valid=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<=10?x:null;
 return {inicial:valid(values[0]),final:valid(values[1])};
}
module.exports={getByMunicipio,provenance};
