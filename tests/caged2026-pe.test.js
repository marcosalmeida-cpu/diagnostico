'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {getByMunicipio:read,SOURCE}=require('../data/caged2026pe');
test('Novo Caged 09/2026 PE: saldo confere e salário médio é nominal, sem inferir oportunidades abertas',()=>{
 assert.equal(SOURCE.period,'09/2026');
 assert.equal(Object.keys(SOURCE.sourceDownloads).length,4);
 for(const sha of Object.values(SOURCE.sourceDownloads))assert.match(sha,/^[a-f0-9]{64}$/);
 assert.deepEqual(read('2611606'),{admissoes:22099,desligamentos:19033,saldo:3066,salario:2366.83});
 assert.deepEqual(read('2604106'),{admissoes:3574,desligamentos:4670,saldo:-1096,salario:2285.44});
 assert.equal(read('3154606'),null);
 assert.equal(read('3550308'),null);
 assert.equal(read('invalid'),null);
});
