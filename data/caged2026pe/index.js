'use strict';
const zlib=require('node:zlib');
const snapshot=require('./snapshot');
// MTE Novo Caged ajustado — curadoria pública Condepe/Fidem, PE, setembro de 2026.
// Total da movimentação e salário médio de admissão não são oportunidades abertas.
const records=JSON.parse(zlib.gunzipSync(Buffer.from(snapshot,'base64')).toString('utf8'));
const SOURCE=Object.freeze({
 name:'MTE / Novo Caged · curadoria Condepe/Fidem, Pernambuco',
 period:'09/2026',
 sourceUrl:'https://www.cf.pe.gov.br/observatorio/fontes/mte_novo_caged',
 sourceDownloads:{
  admissoes:'b576dcf3d9d4b241fb3a98862233cfbc7e58d3c1a94286c3bb745faf37d7220d',
  desligamentos:'c9b448958d9507a865daad989399eea932054228e559607baa8aec8014915c7c',
  saldo:'34a9ccb185cb343c26998d088dfa514f0d38b07dd6fea500708d3c10961d753c',
  salario:'56ecc457d8e86e2c2cf577ffb3f075dd998bece420cb10a7fe83100d7af3c9ad'
 },
 coverage:'183 municípios com movimento formal informado em 09/2026, dentre 185 do PE',
 caveat:'Saldo=admissões-desligamentos; salário médio nominal de admissão; não representa vagas abertas e não indica estoque de vínculos.'
});
if(Object.keys(records).length!==183)throw Error('Novo Caged PE 09/2026: quantidade divergente, rejeitar snapshot.');
function getByMunicipio(code){
 const k=String(code||'');
 if(!/^26\d{5}$/.test(k))return null;
 const row=records[k];
 if(!Array.isArray(row)||row.length!==4)return null;
 const [admissoes,desligamentos,saldo,salario]=row;
 const nonnegative=v=>Number.isSafeInteger(v)&&v>=0;
 if(!nonnegative(admissoes)||!nonnegative(desligamentos)||!Number.isSafeInteger(saldo)||saldo!==admissoes-desligamentos)return null;
 if(salario!==null&&(!Number.isFinite(salario)||salario<0))return null;
 return {admissoes,desligamentos,saldo,salario};
}
module.exports={getByMunicipio,SOURCE};
