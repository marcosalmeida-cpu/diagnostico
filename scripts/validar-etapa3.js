'use strict';
const assert=require('node:assert/strict');
const {getSchoolCensus}=require('../lib/censo-escolar-ibge');
const {getEducationFrequency}=require('../lib/educacao-ibge');
async function run(){
 for(const code of ['3106200','3550308','3154606']){
  const [enroll,frequency]=await Promise.all([getSchoolCensus(code),getEducationFrequency(code)]);
  assert(enroll?.fields?.fundamental?.current>1000,'INEP/IBGE ensino fundamental indisponível: '+code);
  assert(enroll?.fields?.medio?.current>100,'INEP/IBGE ensino médio indisponível: '+code);
  assert(enroll?.fields?.escolas_fundamental?.current>1,'INEP/IBGE escolas indisponíveis: '+code);
  assert(frequency?.rates?.['31615']>60&&frequency.rates['31615']<=100,'IBGE frequência escolar indisponível: '+code);
  console.log('ETAPA3_MUNICIPIO',JSON.stringify({code,year:enroll.year,matriculas:{
   creche:enroll.fields.creche.current,pre:enroll.fields.pre_escola.current,
   fundamental:enroll.fields.fundamental.current,medio:enroll.fields.medio.current},
   escolasFundamental:enroll.fields.escolas_fundamental.current,
   professoresFundamental:enroll.fields.docentes_fundamental.current,
   freq6a14:frequency.rates['31615'],freq15a17:frequency.rates['2792']
  }));
 }
}
run().catch(e=>{console.error('ETAPA3_ERROR',e.stack);process.exitCode=1;});
