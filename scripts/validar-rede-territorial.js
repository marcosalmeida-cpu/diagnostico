'use strict';
const assert=require('node:assert/strict');
const {listOSCs,getContact}=require('../api/rede-oscs');
const {getCadSuasDirectory}=require('../api/rede-suas');
async function run(){
 const [oscs,contact,suas]=await Promise.all([
   listOSCs('3106200',1),
   getContact('3106200',511766),
   getCadSuasDirectory('3106200',1,'26')
 ]);
 assert(oscs?.total>100&&oscs.items.length>0,'Ipea não listou BH');
 assert(oscs.items.every(x=>x.name&&x.url.includes('/detalhar/')),'Ipea: registro incompleto');
 assert(contact?.phone&&contact?.email&&contact?.areas?.length,'Ipea: contatos da organização de controle indisponíveis');
 assert(suas?.items.length>=1,'CadSUAS não retornou CREAS BH');
 assert(suas.items.every(x=>/^CREAS/.test(x.name)&&x.url.includes('aplicacoes.mds.gov.br')),'CadSUAS: tipo errado');
 assert(suas.items.some(x=>x.address&&/BELO HORIZONTE/i.test(x.address)),'CadSUAS: sem endereços oficiais');
 console.log('REDE_TERRITORIAL_VERIFICADA',JSON.stringify({
  oscs:{total:oscs.total,first:oscs.items.slice(0,2)},
  contatoIpea:{nome:contact.name,telefone:contact.phone,areas:contact.areas},
  suas:{count:suas.items.length,hasMore:suas.hasMore,items:suas.items.slice(0,4)}
 }));
}
run().catch(e=>{console.error('REDE_TERRITORIAL_FALHOU',e.stack);process.exitCode=1});
