'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'nav-variants.css'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');

test('bar única mantém Temas, Públicos e filtros, sem criar outra página',()=>{
 assert.match(html,/id="switchThemes"/);
 assert.match(html,/id="switchAudiences"/);
 assert.match(html,/id="activeTabs"/);
 assert.ok(!html.includes('id="themeTabs"')&&!html.includes('id="audienceTabs"'));
 assert.ok(html.indexOf('/styles.css')<html.indexOf('/nav-variants.css'));
 assert.ok(app.includes('URLSearchParams'));
 assert.ok(app.includes("'ultra' : 'premium'"));
});

test('paleta amarela da marca rege hover e seleção de abas e alternador',()=>{
 for(const token of ['#FFC000','#FFE28A','#10265B'])assert.ok(css.includes(token),'Falta '+token);
 for(const selector of [
 '.premium-switch .switch-button.is-active',
 '.dashboard-nav .premium-tabs .dashboard-tab.is-active',
 '.premium-switch .switch-button:hover',
 '.dashboard-nav .premium-tabs .dashboard-tab:hover',
 '.premium-switch .switch-button:focus-visible',
 '.dashboard-nav .premium-tabs .dashboard-tab:focus-visible'
 ])assert.ok(css.includes(selector),'Seletor ausente: '+selector);
 assert.match(css,/background:\s*var\(--nav-yellow\)/);
 assert.match(css,/background:\s*var\(--nav-hover\)/);
 assert.match(css,/color:\s*var\(--nav-ink\)/);
});

test('duas alternativas compactas acessíveis com mobile mínimo de toque',()=>{
 assert.ok(css.includes('html[data-nav-style="ultra"]'));
 assert.ok(css.includes('min-height: var(--nav-tap)'));
 assert.ok(css.includes('--nav-tap:42px'));
 assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});
