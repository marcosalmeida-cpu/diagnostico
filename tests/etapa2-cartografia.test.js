'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validateGeometry,validateList}=require('../api/cartografia-ibge');
const example={type:'FeatureCollection',features:[{properties:{codarea:'3106200'},geometry:{type:'Polygon',coordinates:[[[-43.99,-19.99],[-43.96,-19.99],[-43.96,-19.95],[-43.99,-19.99]]]}}]};
test('malha GeoJSON só é aceita quando município e polígonos conferem',()=>{
 const result=validateGeometry(example,'3106200');
 assert.equal(result.vertices,4);
 assert.equal(result.bounds.minLon,-43.99);
 assert.equal(validateGeometry(example,'3550308'),null);
 assert.equal(validateGeometry({type:'FeatureCollection',features:[]},'3106200'),null);
});
test('descarta geometrias inválidas e evita atribuir nomes a limites ausentes',()=>{
 const corrupt=structuredClone(example);
 corrupt.features[0].geometry.coordinates[0][2][0]=NaN;
 assert.equal(validateGeometry(corrupt,'3106200'),null);
 assert.deepEqual(validateList([{id:310620005,nome:'Belo Horizonte'},{id:310620005,nome:'Duplicado'}]),[{id:310620005,name:'Belo Horizonte'}]);
});
