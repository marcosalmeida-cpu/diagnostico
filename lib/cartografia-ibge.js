'use strict';
// Malha municipal e unidades administrativas do IBGE: não inferir geometrias
// de distritos, subdistritos ou regionais municipais sem malha oficial correspondente.
const API='https://servicodados.ibge.gov.br/api';
const validCode=code=>/^[0-9]{7}$/.test(String(code));
async function getJson(url,timeout=10000){
 const r=await fetch(url,{headers:{accept:'application/vnd.geo+json,application/json'},signal:AbortSignal.timeout(timeout)});
 if(!r.ok)throw Error('IBGE indisponível: HTTP '+r.status);
 const body=await r.text();
 if(body.length>1600000||!body.trimStart().startsWith('{')&&!body.trimStart().startsWith('['))throw Error('Geometria excessiva ou inválida');
 return JSON.parse(body);
}
function validateGeometry(geo,code){
 if(!validCode(code)||geo?.type!=='FeatureCollection'||!Array.isArray(geo.features)||geo.features.length!==1)return null;
 const feat=geo.features[0],g=feat.geometry;
 if(String(feat.properties?.codarea)!==String(code)||!['Polygon','MultiPolygon'].includes(g?.type))return null;
 const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 if(!Array.isArray(polygons)||!polygons.length||polygons.length>100)return null;
 let n=0,minLon=180,maxLon=-180,minLat=90,maxLat=-90;
 for(const poly of polygons){
  if(!Array.isArray(poly)||!poly.length||poly.length>80)return null;
  for(const ring of poly){
   if(!Array.isArray(ring)||ring.length<3||ring.length>40000)return null;
   for(const xy of ring){
    if(!Array.isArray(xy)||xy.length<2)return null;
    const [lon,lat]=xy;
    if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<-80||lon>-25||lat<-36||lat>11)return null;
    minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon);
    minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);n++;
    if(n>45000)return null;
   }
  }
 }
 if(maxLon-minLon<=0||maxLat-minLat<=0)return null;
 return {polygons,bounds:{minLon,maxLon,minLat,maxLat},vertices:n};
}
function validateList(items){
 if(!Array.isArray(items)||items.length>500||items.some(x=>!Number.isSafeInteger(x?.id)||typeof x?.nome!=='string'||!x.nome.trim()||x.nome.length>160))return [];
 const set=new Set();
 return items.filter(x=>{if(set.has(x.id))return false;set.add(x.id);return true})
   .map(x=>({id:x.id,name:x.nome.trim()}));
}
async function getMunicipalMap(code){
 if(!validCode(code))return null;
 const base=API+'/v3/malhas/municipios/'+code+'?formato=application%2Fvnd.geo%2Bjson&qualidade=';
 const req=[
  getJson(base+'intermediaria',12500).catch(()=>getJson(base+'minima',10000)),
  getJson(API+'/v1/localidades/municipios/'+code+'/distritos'),
  getJson(API+'/v1/localidades/municipios/'+code+'/subdistritos')
 ];
 const [geo,districts,subdistricts]=await Promise.allSettled(req);
 return {geometry:geo.status==='fulfilled'?validateGeometry(geo.value,code):null,
  districts:districts.status==='fulfilled'?validateList(districts.value):[],
  subdistricts:subdistricts.status==='fulfilled'?validateList(subdistricts.value):[],
  geometrySource:'IBGE API Malhas v3',divisionsSource:'IBGE API Localidades v1',
  note:'A API de Malhas não disponibilizou contornos internos de distritos/subdistritos; seus nomes são informativos, não áreas desenhadas.'};
}
module.exports={getMunicipalMap,validateGeometry,validateList};
