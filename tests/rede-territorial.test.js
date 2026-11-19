'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseList:parseOsc,parseContact}=require('../api/rede-oscs');
const {parseList:parseSuas,parseDetails,extractSelect}=require('../api/rede-suas');
test('Mapa OSC por codigo IBGE nao altera a natureza juridica nem inventa CNPJ',()=>{
 const r=parseOsc({total:12,lista:[{id_osc:55,tx_nome_osc:'INSTITUTO MUNICIPAL',cd_identificador_osc:'05461315000150',tx_natureza_juridica_osc:'Associação Privada',tx_endereco_osc:'Rua X, 10',tx_nome_atividade_economica:'Assistência social'}]},'3106200',1);
 assert.equal(r.items[0].name,'INSTITUTO MUNICIPAL');
 assert.equal(r.items[0].cnpj,'05461315000150');
 assert.equal(r.items[0].category,'Associação Privada');
 assert.equal(parseOsc({total:1,lista:[{id_osc:1,tx_nome_osc:'OSC',cd_municipio:'3550308'}]},'3106200',1),null);
});
test('Detalhe OSC busca apenas contato institucional do municipio consultado',()=>{
 const data={cd_municipio:'3106200',tx_telefone:'31 3236-1600',tx_email:'contato@entidade.org',tx_endereco:'Rua do Centro',nr_localizacao:'42',tx_nome_municipio:'Belo Horizonte'};
 const head={tx_razao_social_osc:'REDE CIDADA',tx_nome_natureza_juridica_osc:'Associação Privada'};
 const areas=[{dc_area_atuacao:{tx_nome_area_atuacao:'Assistência social'}}];
 const r=parseContact(data,head,areas,'3106200',511766);
 assert.equal(r.phone,'31 3236-1600');assert.equal(r.areas[0],'Assistência social');
 assert.equal(parseContact(data,head,areas,'3550308',511766),null);
});
test('CadSUAS extrai município e unidades, com endereço e telefone da aba pública',()=>{
 const sel='<select name="consultaExternaHelper.endereco.municipio.id"><option value="583">BELO HORIZONTE</option></select>';
 assert.deepEqual(extractSelect(sel,'consultaExternaHelper.endereco.municipio.id'),[{id:'583',name:'BELO HORIZONTE'}]);
 const html='<select name="consultaExternaHelper.tipoEntidade.id"><option value="05">CRAS</option></select>'+
 '<table id="entidadeList"><tbody><tr class="odd"><td></td><td><a href="visualizarEntidadeConsultaExterna.html?aba=dados_cadastrais&codigo=223584">CRAS VILA CEMIG</a></td><td>31062004850</td><td>MG</td><td>BELO HORIZONTE</td></tr></tbody></table>';
 const rows=parseSuas(html,'3106200','MG','Belo Horizonte',1,'05');
 assert.equal(rows.items[0].name,'CRAS VILA CEMIG');assert.equal(rows.items[0].registration,'31062004850');
 assert.equal(rows.items[0].category,'CRAS');
 assert.equal(parseSuas(html,'3106200','SP','Belo Horizonte',1,'05'),null);
 const detail='<strong>Endere&ccedil;o: </strong>RUA ANHANGUERA, 79, SANTA TEREZA, CEP: 31.015-090, BELO HORIZONTE/MG</div><strong>Telefone: </strong>(31) 3333-7777</div><strong>E-mail Institucional: </strong>unidade@prefeitura.gov.br</td>';
 const d=parseDetails(detail);
 assert.match(d.address,/ANHANGUERA/);
 assert.equal(d.phone,'(31) 3333-7777');
 assert.equal(d.email,'unidade@prefeitura.gov.br');
});
