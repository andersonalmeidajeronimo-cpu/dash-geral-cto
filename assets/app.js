/* Governança CTO · site com duas pernas: Sell Out (Dash Geral, mesma lógica do DASH_GERAL_CTO_POWERQUERY.xlsx) e Sell In (P&L Restated + Order Management).
   Sell Out: R$ e caixas somam o nível SEGMENTO; PDV vem do TOTAL, da MARCA ou do SEGMENTO conforme o recorte (sem soma dupla no total).
   Sell In: mesmo formato de linha; R$ = NR, caixas = VOL do P&L, sem positivação. */
(() => {
const DSO = window.DASH, DSI = window.DASH.sellin || null;
let MODO = 'so', D = DSO;
const T = (so, si) => (MODO === 'si' ? si : so);   // texto conforme a perna
const COL = {recorte:2, uf:3, grp:4, executivo:5, canal:6, fonte:7, janela:8, nivel:9, marca:10, segmento:11};
const RS = 12, CX = 13, PDV = 14, ANO0 = 2023;
let ANOS = [2023, 2024, 2025, 2026];
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const mes = k => MESES[k-1].toLowerCase();
const MES_LONGO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
let dic = D.dic;
const id = (c, v) => dic[c].indexOf(v);
let NIV, TODAS, TODOS, MED, MEDS, FILTROS, PAGES, MARCA_PAG, HN;
const FILTROS_SO = [['recorte','Recorte'],['uf','UF'],['grp','Grp. Econômico'],['executivo','Executivo de Vendas'],['canal','Canal'],
                    ['fonte','Fonte'],['janela','Comparabilidade'],['marca','Marca'],['segmento','Segmento']];
const FILTROS_SI = [['grp','Cliente'],['recorte','Cliente (L4)'],['executivo','Executivo'],['canal','Canal'],['uf','BU'],['marca','Marca'],['segmento','Segmento']];
const PAGES_SO = [
  ['inicio','Início'], ['geral','Dados gerais'], ['veja','Veja'], ['vanish','Vanish'], ['harpic','Harpic'], ['finish','Finish'],
  ['hn','H&N'], ['diretor','Visão do Diretor'], ['clientes','Clientes'], ['executivos','Executivos'], ['redes-scan','Redes Scanntech'], ['redes-col','Redes Colecta'], ['confronto','Confronto de fontes'], ['depara','De-para'], ['base','Base geral']];
const PAGES_SI = [
  ['si-inicio','Início'], ['si-geral','Dados gerais'], ['si-veja','Veja'], ['si-vanish','Vanish'], ['si-harpic','Harpic'], ['si-finish','Finish'],
  ['si-hn','H&N'], ['si-diretor','Visão do Diretor'], ['si-clientes','Clientes'], ['si-exec','Executivos'], ['si-q4','Plano Q4'], ['si-mes','Mês em curso'], ['si-rv','RV'], ['si-base','Base geral']];
/* linha das visões: as mesmas nas duas pernas; Plano Q4, Mês em curso e RV são do sell in (levam para a perna Sell In) */
const NAV = [['Início', 'inicio', 'si-inicio'], ['Dados gerais', 'geral', 'si-geral'], ['Visão do Diretor', 'diretor', 'si-diretor'], ['Clientes', 'clientes', 'si-clientes'],
  ['Executivos', 'executivos', 'si-exec'], ['Plano Q4', null, 'si-q4'], ['Mês em curso', null, 'si-mes'], ['RV', null, 'si-rv']];
const PAI = {veja: 'geral', vanish: 'geral', harpic: 'geral', finish: 'geral', hn: 'geral', 'si-veja': 'si-geral', 'si-vanish': 'si-geral', 'si-harpic': 'si-geral', 'si-finish': 'si-geral', 'si-hn': 'si-geral',
  'redes-scan': 'clientes', 'redes-col': 'clientes', confronto: 'inicio', depara: 'inicio', base: 'inicio', 'si-base': 'si-inicio'};
const TODAS_PAGES = [...PAGES_SO, ...PAGES_SI];
const S = {page: 'inicio', f: {}, corte: DSO.corte, ui: {}, uiSO: {}, uiSI: {}, fSO: {}, fSI: {}, corteSO: DSO.corte, corteSI: DSI ? DSI.corte : DSO.corte};
FILTROS_SO.forEach(([k]) => { S.fSO[k] = new Set(); S.fSI[k] = new Set(); });
function aplicarModo(m) {   // troca a perna: dados, dicionário, medidas, filtros e páginas
  if (m === 'si' && !DSI) m = 'so';
  if (MODO === m && NIV) return;
  if (NIV) { if (MODO === 'si') S.corteSI = S.corte; else S.corteSO = S.corte; }
  MODO = m; D = m === 'si' ? DSI : DSO; dic = D.dic;
  NIV = {TOTAL: id('nivel','TOTAL'), MARCA: id('nivel','MARCA'), SEG: id('nivel','SEGMENTO')};
  TODAS = id('marca','(TODAS AS MARCAS)'); TODOS = id('segmento','(TODOS OS SEGMENTOS)');
  MED = m === 'si'
    ? {rs: {col: RS, nome: 'NR R$', curto: 'NR', media: false}, cx: {col: CX, nome: 'Caixas', curto: 'Caixas', media: false}}
    : {rs: {col: RS, nome: 'Sell out R$', curto: 'R$', media: false}, cx: {col: CX, nome: 'Caixas', curto: 'Caixas', media: false},
       pdv: {col: PDV, nome: 'PDVs positivados', curto: 'PDVs', media: true}};
  MEDS = Object.keys(MED);
  ANOS = m === 'si' ? [2024, 2025, 2026] : [2023, 2024, 2025, 2026];
  FILTROS = m === 'si' ? FILTROS_SI : FILTROS_SO;
  PAGES = m === 'si' ? PAGES_SI : PAGES_SO;
  MARCA_PAG = m === 'si' ? {'si-veja': ['VEJA'], 'si-vanish': ['VANISH'], 'si-harpic': ['HARPIC'], 'si-finish': ['FINISH']}
                         : {veja: ['VEJA'], vanish: ['VANISH'], harpic: ['HARPIC'], finish: ['FINISH']};
  HN = m === 'si'
    ? [['BEM ESTAR SEXUAL (JONTEX + OLLA)', ['JONTEX','OLLA']], ['SUSTAGEN', ['SUSTAGEN']], ['VEET E DERMODEX', ['VEET','DERMODEX']],
       ['OUTRAS DE HEALTH', ['LUFTAL','LUFTAGASTRO','LUFTALAX','STREPSILS','NALDECON','NUROMOL','LUFTAFEM']]]
    : [['SUSTAGEN', ['SUSTAGEN']], ['BEM ESTAR SEXUAL (JONTEX + OLLA)', ['JONTEX','OLLA']], ['VEET', ['VEET']]];
  S.f = m === 'si' ? S.fSI : S.fSO;
  S.ui = m === 'si' ? S.uiSI : S.uiSO;   // ordenação, abas internas e seleção não vazam de uma perna para a outra
  S.corte = m === 'si' ? S.corteSI : S.corteSO;
}
aplicarModo('so');
const modoDaPagina = pg => (String(pg).startsWith('si-') ? 'si' : 'so');

/* ---------- estado ----------
   Site (GitHub): o recorte fica no endereço da página, então o link já abre filtrado.
   Link do claude.ai (window.DASH_ARTIFACT): o endereço só aceita a página (#veja); o recorte fica lembrado neste navegador. */
const ART = !!window.DASH_ARTIFACT, CHAVE = 'dash-geral-cto';
function lerHash() {
  if (ART) {
    FILTROS.forEach(([k]) => S.f[k] = new Set()); S.corte = D.corte; S.page = 'inicio';
    let st = null; try { st = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { st = null; }
    if (st && typeof st === 'object') {
      if (PAGES.some(p => p[0] === st.page)) S.page = st.page;
      if (st.gerado === D.gerado && st.corte >= 1 && st.corte <= D.ult26) S.corte = st.corte;
      Object.entries(st.f || {}).forEach(([k, vs]) => { if (S.f[k] && Array.isArray(vs)) vs.forEach(x => { const i = id(k, x); if (i >= 0) S.f[k].add(i); }); });
    }
    const h = location.hash.slice(1); if (PAGES.some(p => p[0] === h)) S.page = h;
    return;
  }
  const partes = location.hash.slice(1).split('&').map(x => { try { return decodeURIComponent(x); } catch (e) { return ''; } });
  const [pg, ...qs] = partes;
  aplicarModo(modoDaPagina(pg));
  S.page = PAGES.some(p => p[0] === pg) ? pg : (MODO === 'si' ? 'si-inicio' : 'inicio');
  FILTROS.forEach(([k]) => S.f[k].clear());
  S.corte = D.corte;
  qs.forEach(q => {
    const i = q.indexOf('='); if (i < 0) return;
    const k = q.slice(0, i), v = q.slice(i + 1);
    if (k === 'corte') { const n = +v; if (n >= 1 && n <= D.ult26) S.corte = n; }
    else if (S.f[k] && v) v.split('|').forEach(x => { const i = id(k, x); if (i >= 0) S.f[k].add(i); });
  });
}
function gravarHash(novaEntrada = false) {
  if (ART) {
    const f = {}; FILTROS.forEach(([k]) => { if (S.f[k].size) f[k] = [...S.f[k]].map(i => dic[k][i]); });
    try { localStorage.setItem(CHAVE, JSON.stringify({page: S.page, corte: S.corte, gerado: D.gerado, f})); } catch (e) { /* sem memória neste navegador */ }
    return;
  }
  const p = [S.page];
  FILTROS.forEach(([k]) => { if (S.f[k].size) p.push(k + '=' + [...S.f[k]].map(i => dic[k][i]).join('|')); });
  if (S.corte !== D.corte) p.push('corte=' + S.corte);
  const url = '#' + p.map(encodeURIComponent).join('&').replace(/%3D/g, '=');
  try { if (novaEntrada) history.pushState(null, '', url); else history.replaceState(null, '', url); } catch (e) { /* navegador sem histórico */ }
  ULTIMO = location.hash;   // pushState não dispara evento: a guarda do doEndereco passa a comparar com o endereço atual
}

/* ---------- motor de cálculo ---------- */
let BASE = [], PBASE = [], OMB = [], OMB_ANT = [];
function filtrar() {
  const ativos = FILTROS.filter(([k]) => k !== 'marca' && k !== 'segmento' && S.f[k].size).map(([k]) => [COL[k], S.f[k]]);
  BASE = D.rows.filter(r => ativos.every(([c, s]) => s.has(r[c])));
  PBASE = MODO === 'si' ? (D.plano || []).filter(r => ativos.every(([c, s]) => s.has(r[c]))) : [];
  OMB = MODO === 'si' ? omFiltrado() : [];
  OMB_ANT = MODO === 'si' && D.om && D.om.linhas_ant ? omFiltrado(D.om.linhas_ant) : [];   // faturado dos meses anteriores do trimestre
}
/* Order Management (mês em curso): [grp, executivo, canal, BU, marca, segmento, flag do item 1 da régua (definição no arquivo cifrado), faturado cx, carteira liberada cx, alocação cx, futura cx, NR/cx, sold to, UF, L4 (-1 sem par), carteira bloqueada cx] */
const OMC = {grp: 0, executivo: 1, canal: 2, uf: 3, marca: 4, segmento: 5};
function omFiltrado(linhas) {
  if (!D.om) return [];
  const at = ['grp', 'executivo', 'canal', 'uf'].filter(k => S.f[k].size).map(k => [OMC[k], S.f[k]]);
  const l4 = S.f.recorte.size ? S.f.recorte : null;   // L4 do P&L pelo código Plan to de cada pedido (coluna 14)
  return (linhas || D.om.linhas).filter(l => at.every(([c, st]) => st.has(l[c])) && (!l4 || l4.has(l[14])));
}
function omSoma({marcas = null, segs = null, chave = null, sub = null, so = null, linhas = null} = {}) {   // so: 'hyg' = só Hygiene (a régua do Q4)
  const out = new Map(), hy = id('uf', 'Hygiene');
  for (const l of linhas || OMB) {
    if (marcas && !marcas.has(l[4])) continue;
    if (segs && !segs.has(l[5])) continue;
    if (so === 'hyg' && l[3] !== hy) continue;
    if (sub && !sub(l)) continue;
    const k = chave ? chave(l) : '_';
    let o = out.get(k); if (!o) { o = {...ZERO_OM}; out.set(k, o); }
    const bq = l[15] || 0;
    o.fat += l[7]; o.cart += l[8]; o.aloc += l[9]; o.fut += l[10]; o.bloq += bq; o.nfat += l[7] * l[11]; o.ncart += (l[8] + l[9]) * l[11]; o.nfut += l[10] * l[11]; o.nbloq += bq * l[11];
    if (l[6]) { o.vfat += l[7]; o.vped += l[7] + l[8] + l[9]; }
  }
  return out;
}
const setOuNull = s => (s && s.size ? s : null);
const gMarcas = () => setOuNull(S.f.marca);
const gSegs = () => setOuNull(S.f.segmento);
const marcasDe = nomes => new Set(nomes.map(n => id('marca', n)).filter(i => i >= 0));
/* devolve Map chave -> Float64Array(48) [ano x mês], NaN = sem dado */
function cubo(med, {marcas = null, segs = null, chave = null, porMarca = false, rows = BASE, sub = null, semCorte = false} = {}) {
  const col = MED[med].col;
  const nivel = med !== 'pdv' ? NIV.SEG : (segs ? NIV.SEG : ((marcas || porMarca) ? NIV.MARCA : NIV.TOTAL));
  const out = new Map();
  for (const r of rows) {
    if (r[COL.nivel] !== nivel) continue;
    if (marcas && !marcas.has(r[COL.marca])) continue;
    if (segs && !segs.has(r[COL.segmento])) continue;
    if (sub && !sub(r)) continue;
    const k = chave ? chave(r) : '_';
    let a = out.get(k); if (!a) { a = new Float64Array(48).fill(NaN); out.set(k, a); }
    const i = (r[0] - ANO0) * 12 + r[1] - 1;
    a[i] = (isNaN(a[i]) ? 0 : a[i]) + r[col];
  }
  if (!semCorte) { const fs = fimSerie('base'); for (const a of out.values()) for (let m = fs; m < 12; m++) a[36 + m] = NaN; }   // 2026 só até o corte (e o mês parcial logo depois dele, marcado)
  return out;
}
const um = (med, o) => cubo(med, o).get('_') || new Float64Array(48).fill(NaN);
/* plano do Q4 (AR 29/09): mesmas segmentações, meses out a dez de 2026 */
const cuboP = (med, o = {}) => cubo(med, {...o, rows: PBASE, semCorte: true});
const umP = (med, o = {}) => cuboP(med, o).get('_') || new Float64Array(48).fill(NaN);
const Q4M = [10, 11, 12];
const subHyg = sub => { const hy = dic.uf.indexOf('Hygiene'); return sub ? r => r[COL.uf] === hy && sub(r) : r => r[COL.uf] === hy; };   // a régua do Q4 (página Plano Q4) usa só Hygiene
const temPlano = pa => !!pa && Q4M.some(m => v(pa, 2026, m) > 0);
const v = (a, ano, m) => a[(ano - ANO0) * 12 + m - 1];
function agg(a, ano, meses, media) {
  let s = 0, n = 0;
  for (const m of meses) { const x = v(a, ano, m); if (!isNaN(x)) { s += x; n++; } }
  return n ? (media ? s / n : s) : NaN;
}
const ate = n => Array.from({length: n}, (_, i) => i + 1);
const ytd = (a, ano, med) => agg(a, ano, ate(S.corte), MED[med].media);
const ano = (a, y, med) => agg(a, y, ate(12), MED[med].media);
const varr = (n, d) => (isFinite(n) && isFinite(d) && d > 0 && d >= 0.01 * Math.abs(n) ? n / d - 1 : NaN);   // sem % absurdo sobre base mínima (ex.: R$ 1 no mês)   // base zero ou negativa (devolução no P&L) não gera %

/* ---------- formatos pt-BR ---------- */
const nf0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const nf2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const n0 = x => (isFinite(x) ? nf0.format(x) : '');
const n2 = x => (isFinite(x) ? nf2.format(x) : '');
const mi = x => (isFinite(x) ? 'R$ ' + nf2.format(x / 1e6) + ' Mi' : 'sem dado');
const curto = x => !isFinite(x) ? '' : Math.abs(x) >= 1e6 ? nf1.format(x / 1e6) + ' Mi' : Math.abs(x) >= 1e4 ? nf0.format(x / 1e3) + ' mil' : nf0.format(x);
const pc = x => (isFinite(x) ? (x > 0 ? '+' : '') + nf1.format(x * 100) + '%' : '');
const p1 = x => (isFinite(x) ? nf1.format(x * 100) + '%' : '');
const cls = x => (!isFinite(x) ? '' : x > 0.0005 ? 'up' : x < -0.0005 ? 'down' : '');
const vc = x => (isFinite(x) ? `<span class="vr ${cls(x) || 'flat'}">${pc(x)}</span>` : '');   // selo de crescimento/perda nas tabelas
const vcm = (x, m, k) => (ehParcial(m, 2026, k) && isFinite(x) ? `<span class="vr parc">${pc(x)}</span>` : vc(x));   // variação do mês parcial em cinza: ainda não é perda nem ganho
const vbig = x => (isFinite(x) ? `<span class="vbig ${cls(x) || 'flat'}">${x > 0.0005 ? '▲' : x < -0.0005 ? '▼' : '●'} ${pc(x)}</span>` : '');   // destaque nos cards e títulos
const fmtMed = (med, x) => (med === 'rs' ? mi(x) : isFinite(x) ? nf0.format(x) : 'sem dado');
const semAcento = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tit = s => esc(s).toLowerCase().replace(/(^|[\s(+.-])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bDf\b|\bGo\b|\bMs\b|\bMt\b|\bTo\b|\bPa\b|\bJc\b|\bDac\b|\bSto\b|\bVmu\b|\bVlp\b|\bVps\b|\bA\.s\.e\b/g, x => x.toUpperCase());
const mkCls = m => (m === 'VEJA' ? 'mk-veja' : m === 'VANISH' ? 'mk-vanish' : '');
const corteTxt = () => `jan a ${mes(cR())}${marcaParc(cR())}`;   // "jan a out*" quando o corte é o mês parcial; nas redes, o corte da fonte

/* ---------- componentes ---------- */
const tip = document.getElementById('tip');
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) { tip.style.opacity = 0; return; }
  tip.innerHTML = t.dataset.tip; tip.style.opacity = 1;
});
document.addEventListener('mousemove', e => {
  if (tip.style.opacity !== '1') return;
  const w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(e.clientX + 14, innerWidth - w - 8)) + 'px'; tip.style.top = (e.clientY + 16) + 'px';
});

let SLIDE = false;   // ligado enquanto os slides são montados: gráficos no tamanho do slide, não da tela de quem gera
function larguraCard() {
  if (SLIDE) return 1160;
  const app = document.getElementById('app'), w = app ? app.clientWidth : 1000;
  return w - (innerWidth < 640 ? 80 : 100);   // padding do main + padding do card
}
function chart(a, med, alto = 250, larg = null, rotulos = true, opc = {}) {
  const W = Math.round(Math.max(240, Math.min(1180, larg || larguraCard()))), H = alto, pt = 26, gw = W / 12, bw = gw * 0.3;
  const comValor = rotulos && gw >= 46, comVar = rotulos && !opc.semVar && gw >= 50;
  const pb = comVar ? 50 : 28;
  const pa = temPlano(opc.plano) ? opc.plano : null;
  let mx = 0; for (let m = 1; m <= 12; m++) for (const y of [2025, 2026]) { const x = v(a, y, m); if (x > mx) mx = x; }
  if (pa) for (const m of Q4M) { const x = v(pa, 2026, m); if (x > mx) mx = x; }
  if (!mx) return '<div class="empty">Sem dado para este recorte.</div>';
  const h = x => (isFinite(x) && x > 0 ? (x / mx) * (H - pt - pb) : 0);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MED[med].nome} 2025 e 2026 por mês">`;
  for (let m = 1; m <= 12; m++) {
    const x0 = (m - 1) * gw + gw / 2, a25 = v(a, 2025, m), a26 = v(a, 2026, m), h25 = h(a25), h26 = h(a26);
    s += `<rect x="${x0 - bw - 2}" y="${H - pb - h25}" width="${bw}" height="${h25}" rx="4" fill="#D2D2D7"/>`;
    if (h26) s += `<rect x="${x0 + 2}" y="${H - pb - h26}" width="${bw}" height="${h26}" rx="4" fill="#FF007F"/>`;
    if (h26 && comValor) s += `<text class="vl" x="${x0 + 2 + bw / 2}" y="${H - pb - h26 - 7}" text-anchor="middle" font-size="12" font-weight="600" fill="#1D1D1F">${curto(a26)}</text>`;
    const p26 = pa && !h26 ? v(pa, 2026, m) : NaN, hp = h(p26);
    if (hp) {
      s += `<rect x="${x0 + 2}" y="${H - pb - hp}" width="${bw}" height="${hp}" rx="4" fill="#6E6E73"/>`;
      if (comValor) s += `<text class="vl" x="${x0 + 2 + bw / 2}" y="${H - pb - hp - 7}" text-anchor="middle" font-size="12" font-weight="600" fill="#6E6E73">${curto(p26)}</text>`;
      const vp = varr(p26, a25), rs_ = med === 'rs' ? 'R$ ' : '';
      s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${(gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]) + marcaParc(m, 2026, opc.pk)}</text>`;
      if (comVar && isFinite(vp)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#6E6E73">${pc(vp)}</text>`;
      s += `<rect x="${(m - 1) * gw}" y="0" width="${gw}" height="${H}" fill="transparent" data-tip="${esc(`<b>${MESES[m - 1]}</b> · 2025: ${rs_}${n0(a25) || 'sem dado'} · Plano Q4 (AR): ${rs_}${n0(p26)} ${isFinite(vp) ? '· ' + pc(vp) : ''}`)}"/>`;
      continue;
    }
    s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${(gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]) + marcaParc(m, 2026, opc.pk)}</text>`;
    const vm = (opc.fv || varr)(a26, a25);
    if (comVar && isFinite(vm)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ehParcial(m, 2026, opc.pk) || Math.abs(vm) <= 0.0005 ? '#6E6E73' : vm > 0 ? '#1D7A34' : '#D70015'}">${pc(vm)}</text>`;   // mês parcial em cinza: ainda não é perda nem ganho
    const vt = opc.semVar ? NaN : (opc.fv || varr)(a26, a25);
    const t = `<b>${mesRot(m, 2026, opc.pk)}</b> · 2025: ${med === 'rs' ? 'R$ ' : ''}${n0(a25) || 'sem dado'} · 2026${ehParcial(m, 2026, opc.pk) ? ` parcial até ${parcialDe(opc.pk).ate}` : ''}: ${med === 'rs' ? 'R$ ' : ''}${n0(a26) || 'sem dado'} ${isFinite(vt) ? '· ' + pc(vt) : ''}`;
    s += `<rect x="${(m - 1) * gw}" y="0" width="${gw}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`;
  }
  return s + '</svg><div class="legend"><span><i style="background:#D2D2D7"></i>2025</span><span><i style="background:#FF007F"></i>2026 até ' + mes(fimSerie(opc.pk)) + marcaParc(fimSerie(opc.pk), 2026, opc.pk) + '</span>' +
    (pa ? '<span><i style="background:#6E6E73"></i>Plano do Q4 (AR de 29/09)</span>' : '') + (notaParcial(opc.pk) ? `<span class="parc-nota">${esc(notaParcial(opc.pk))}</span>` : '') + '</div>';
}

function tabelaMensal(a, med, pa = null) {
  const media = MED[med].media, A = ANOS, U = A.length - 1, tp = temPlano(pa), rf = a;   // o plano cobre as mesmas BUs do recorte
  const vs = j => `${String(A[j + 1]).slice(2)} vs ${String(A[j]).slice(2)}`;
  let h = '<div class="tw"><table><thead><tr><th>Mês</th>' + A.map(y => `<th>${y}</th>`).join('') + (tp ? '<th>Plano Q4</th>' : '') +
          A.slice(1).map((_, j) => `<th>${vs(j)}</th>`).join('') + (tp ? '<th>Plano vs 25</th>' : '') + '<th>Tri 26 vs 25</th></tr></thead><tbody>';
  for (let m = 1; m <= 12; m++) {
    const p = tp ? v(pa, 2026, m) : NaN;
    h += `<tr><td class="b">${mesRot(m)}</td>` + A.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(a, y, m))}</td>`).join('') + (tp ? `<td class="b pl">${n0(p)}</td>` : '');
    for (let j = 0; j < U; j++) h += `<td>${A[j + 1] === 2026 ? vcm(varr(v(a, 2026, m), v(a, A[j], m)), m) : vc(varr(v(a, A[j + 1], m), v(a, A[j], m)))}</td>`;
    if (tp) h += `<td>${vc(varr(p, v(rf, 2025, m)))}</td>`;
    if (m % 3 === 1) {
      const ms = [m, m + 1, m + 2].filter(x => x <= S.corte && isFinite(v(a, 2026, x)));
      let q = ms.length ? varr(agg(a, 2026, ms, media), agg(a, 2025, ms, media)) : NaN, pl = '';
      if (!ms.length && tp && m === 10) { q = varr(agg(pa, 2026, Q4M, false), agg(rf, 2025, Q4M, false)); pl = '<small class="pl"> plano</small>'; }
      const qp = ms.some(x => ehParcial(x));   // trimestre com o mês parcial: cinza e com asterisco
      h += `<td class="q" rowspan="3">${qp && isFinite(q) ? `<span class="vr parc">${pc(q)}*</span>` : vc(q)}${isFinite(q) ? pl : ''}</td>`;
    }
    h += '</tr>';
  }
  const y = A.map(x => ytd(a, x, med)), t = A.map(x => ano(a, x, med)), pt = tp ? agg(pa, 2026, Q4M, false) : NaN;
  h += `<tr class="tot"><td>${media ? 'Média' : 'Total'} ${corteTxt()}</td>` + y.map(x => `<td>${n0(x)}</td>`).join('') + (tp ? '<td></td>' : '') +
       A.slice(1).map((_, j) => `<td>${vc(varr(y[j + 1], y[j]))}</td>`).join('') + (tp ? '<td></td>' : '') + `<td>${vc(varr(y[U], y[U - 1]))}</td></tr>`;
  h += `<tr class="sub"><td>${media ? 'Média' : 'Total'} do ano</td>` + t.map(x => `<td>${n0(x)}</td>`).join('') + (tp ? `<td class="pl">${n0(pt)}</td>` : '') +
       A.slice(1).map((_, j) => `<td>${j < U - 1 ? vc(varr(t[j + 1], t[j])) : ''}</td>`).join('') + (tp ? `<td>${vc(varr(pt, agg(rf, 2025, Q4M, false)))}</td>` : '') + '<td></td></tr>';
  if (tp && !media) {
    const n = A.length + 2 + U + 1;
    const r26 = ano(rf, 2026, med), r25 = ano(rf, 2025, med);
    h += S.corte === D.ult26
      ? `<tr class="sub"><td>2026 com o plano</td><td colspan="${n}" class="l">${n0(r26 + pt)} = realizado de ${corteTxt()} + plano de out a dez, contra ${n0(r25)} em 2025: ${vc(varr(r26 + pt, r25))}</td></tr>`
      : `<tr class="sub"><td>2026 com o plano</td><td colspan="${n}" class="l">Volte o mês de corte para ${mes(D.ult26)} para somar o ano realizado com o plano do Q4.</td></tr>`;
  }
  return h + '</tbody></table></div>';
}

/* bloco com controle R$ · Caixas · PDVs (os três blocos do Power Query num card só) */
const BLOCOS = {};
function bloco(bid, rotulo, opts) {
  BLOCOS[bid] = {rotulo, opts};
  return `<div class="card" id="b-${bid}">${blocoIn(bid)}</div>`;
}
function blocoIn(bid) {
  const {rotulo, opts} = BLOCOS[bid], med = MED[S.ui['m' + bid]] ? S.ui['m' + bid] : 'rs';
  const a = um(med, opts), y26 = ytd(a, 2026, med), y25 = ytd(a, 2025, med), d = varr(y26, y25);
  const pa = MODO === 'si' ? umP(med, opts) : null;
  const ac = mes(S.corte) + marcaParc(S.corte), frase = med === 'pdv' ? `${n0(y26)} PDVs por mês.` : med === 'rs' ? `${mi(y26)} até ${ac}.` : `${n0(y26)} caixas até ${ac}.`;
  const resto = isFinite(d) ? ` ${vbig(d)} <span>sobre 2025${med === 'pdv' ? ', na média mensal' : ''}.</span>` : ' <span>Sem base de 2025 para comparar.</span>';
  return `<p class="eyebrow">${esc(rotulo)} · ${MED[med].nome}</p><h3>${frase}${resto}</h3>
    <div class="seg" data-bid="${bid}">${Object.keys(MED).map(k => `<button data-act="med" data-bid="${bid}" data-m="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>
    ${chart(a, med, 250, null, true, {plano: pa})}${tabelaMensal(a, med, pa)}`;
}

function kpis(opts, extra = true) {
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${vbig(d)}<span>${sub}</span></div></div>`;
  if (MODO === 'si') {   // Sell In: NR, caixas, NR por caixa e clientes com compra
    const r = um('rs', opts), c = um('cx', opts), r26 = ytd(r, 2026, 'rs'), r25 = ytd(r, 2025, 'rs'), c26 = ytd(c, 2026, 'cx'), c25 = ytd(c, 2025, 'cx');
    const G = cubo('rs', {...opts, chave: x => x[COL.grp]}), cli = y => [...G.values()].filter(a => agg(a, y, ate(S.corte), false) > 0).length;
    return `<div class="grid g4">` + card('NR ' + corteTxt(), mi(r26), varr(r26, r25), `sobre ${mi(r25)} em 2025`) +
      card('Caixas ' + corteTxt(), n0(c26), varr(c26, c25), `sobre ${n0(c25)} em 2025`) +
      card('NR por caixa', 'R$ ' + n2(r26 / c26), varr(r26 / c26, r25 / c25), `contra R$ ${n2(r25 / c25)} em 2025`) +
      card('Clientes com compra', n0(cli(2026)), varr(cli(2026), cli(2025)), `contra ${n0(cli(2025))} em 2025`) + '</div>';
  }
  const r = um('rs', opts), c = um('cx', opts), p = um('pdv', opts);
  const r26 = ytd(r, 2026, 'rs'), r25 = ytd(r, 2025, 'rs'), p26 = ytd(p, 2026, 'pdv'), p25 = ytd(p, 2025, 'pdv');
  let h = card('Sell out ' + corteTxt(), mi(r26), varr(r26, r25), `sobre ${mi(r25)} em 2025`) +
          card('Caixas ' + corteTxt(), n0(ytd(c, 2026, 'cx')), varr(ytd(c, 2026, 'cx'), ytd(c, 2025, 'cx')), 'sobre 2025') +
          card('PDVs positivados' + marcaParc(S.corte), n0(p26), varr(p26, p25), `média por mês, contra ${n0(p25)}`);
  if (extra) {
    const t26 = r26 / agg(p, 2026, ate(S.corte), false), t25 = r25 / agg(p, 2025, ate(S.corte), false);   // R$ por PDV-mês, mesmos meses
    h += card('Ticket por PDV' + marcaParc(S.corte), 'R$ ' + n0(t26), varr(t26, t25), `por mês, contra R$ ${n0(t25)}`);
  }
  return `<div class="grid ${extra ? 'g4' : 'g3'}">${h}</div>`;
}

/* tabela YTD por chave (marca, UF, distribuidor) */
function tabelaYTD(rotulo, itens, chaveFn, opts, porMarca = false) {
  const si = MODO === 'si', m2 = si ? 'cx' : 'pdv', A = ANOS, U = A.length - 1;
  const R = cubo('rs', {...opts, chave: chaveFn}), P = cubo(m2, {...opts, chave: chaveFn, porMarca});
  const PL = si ? cuboP('rs', {...opts, chave: chaveFn}) : new Map();
  const linhas = itens.map(([k, nome, extra]) => {
    const a = R.get(k), p = P.get(k), pl = PL.get(k);
    const y = A.map(x => (a ? agg(a, x, ate(S.corte), false) : NaN));
    const pp = [2025, 2026].map(x => (p ? agg(p, x, ate(S.corte), !si) : NaN));   // Sell Out: média de PDV; Sell In: soma de caixas
    const q4 = [pl ? agg(pl, 2026, Q4M, false) : NaN, a ? agg(a, 2025, Q4M, false) : NaN];
    return {nome, extra, y, pp, q4};
  }).filter(l => l.y.some(isFinite) || isFinite(l.q4[0]));
  const comPl = si && linhas.some(l => l.q4[0] > 0);
  const soma = f => linhas.reduce((s, l) => s + (isFinite(f(l)) ? f(l) : 0), 0);
  const tot = A.map((_, j) => soma(l => l.y[j]));
  const PT = um(m2, opts), tp = [ytd(PT, 2025, m2), ytd(PT, 2026, m2)];   // total do recorte, igual ao card
  linhas.sort((a, b) => (b.y[U] || 0) - (a.y[U] || 0));
  const row = (l, c) => `<tr class="${c || ''}"><td class="l">${l.nome}</td>${l.extra !== undefined ? `<td class="l">${l.extra}</td>` : ''}` +
    l.y.map((x, j) => `<td class="${j === U ? 'b' : ''}">${n0(x)}</td>`).join('') +
    A.slice(1).map((_, j) => `<td>${vc(varr(l.y[j + 1], l.y[j]))}</td>`).join('') + `<td>${p1(l.y[U] / tot[U])}</td>` +
    `<td>${n0(l.pp[0])}</td><td class="b">${n0(l.pp[1])}</td><td>${vc(varr(l.pp[1], l.pp[0]))}</td>` +
    (comPl ? `<td class="b pl">${n0(l.q4[0])}</td><td>${n0(l.q4[1])}</td><td>${vc(varr(l.q4[0], l.q4[1]))}</td>` : '') + '</tr>';
  const temExtra = itens.length && itens[0][2] !== undefined;
  const vs = j => `${String(A[j + 1]).slice(2)} vs ${String(A[j]).slice(2)}`;
  return `<div class="tw"><table><thead><tr><th class="l">${rotulo}</th>${temExtra ? `<th class="l">${T('UF', 'Canal')}</th>` : ''}${A.map(y => `<th>${T('R$', 'NR')} ${y}</th>`).join('')}
    ${A.slice(1).map((_, j) => `<th>${vs(j)}</th>`).join('')}<th>Peso 26</th><th>${T('PDVs', 'Caixas')} 25</th><th>${T('PDVs', 'Caixas')} 26</th><th>Var.</th>
    ${comPl ? '<th>Plano Q4</th><th>Q4 2025</th><th>Plano vs Q4/25</th>' : ''}</tr></thead><tbody>
    ${linhas.map(l => row(l)).join('')}${row({nome: 'Total', extra: temExtra ? '' : undefined, y: tot, pp: tp, q4: [soma(l => l.q4[0]), soma(l => l.q4[1])]}, 'tot')}</tbody></table></div>`;
}

/* ---------- selo de validade: avisa o time quando o dado está velho (mesma régua da pasta de chegada) ---------- */
const FERIADOS = new Set(['2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25', '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21',
  '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25']);   // igual ao chegada.py
function validade() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (MODO === 'si') {
    if (!D.om) return null;
    const o = D.om.data, d = new Date(+o.slice(0, 4), +o.slice(4, 6) - 1, +o.slice(6, 8)), dias = Math.round((hoje - d) / 864e5), dw = hoje.getDay();
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const util = dw >= 1 && dw <= 5 && !FERIADOS.has(iso), outroMes = d.getMonth() !== hoje.getMonth() || d.getFullYear() !== hoje.getFullYear();
    const velho = dias >= 4 || (dias > 0 && util && (dw === 1 || dw === 4 || hoje.getDate() >= 20 || outroMes));
    return {velho, txt: `Pedidos de ${o.slice(6, 8)}/${o.slice(4, 6)}${dias > 0 ? ` · há ${dias} dia${dias > 1 ? 's' : ''}` : ' · hoje'}`};
  }
  const esp = mesEsperado(), a = +esp.slice(0, 4), m = +esp.slice(4), co = fonte('colecta'), p = parcialDe('base');   // último mês fechado que o site precisa ter
  const fech = p ? p.mes - 1 : D.ult26, velho = 2026 < a || (2026 === a && fech < m);   // o mês parcial não conta como fechado
  const falta = velho ? ` · falta ${p && p.mes === m && a === 2026 ? 'fechar ' : ''}${mes(m)}/${String(a).slice(2)}` : '';
  return {velho, parcial: !!p, txt: `Sell out até ${mes(D.ult26)}/26${p ? ` · parcial até ${p.ate}` : ''}${co && co.extraido ? ` · Colecta de ${co.extraido.slice(0, 5)}` : ''}${falta}`};
}
const seloValidade = () => { const x = validade(); if (!x) return ''; const c = x.velho ? 'warn' : x.parcial ? 'parc' : 'ok';
  return `<span class="selo ${c}" title="${{warn: 'Dado desatualizado: veja o lembrete da Governança CTO', parc: 'Meses fechados em dia; o mês em curso entra parcial e ainda cresce até o fechamento', ok: 'Dado em dia'}[c]}">${esc(x.txt)}</span>`; };

/* ---------- data de cada fonte do Sell Out: quando foi extraída e até quando vai o dado (textos e datas vêm do arquivo cifrado) ---------- */
const FONTES_PG = {'redes-scan': ['scanntech', 'scanntech_marcas', 'scanntech_share_uf', 'redes_colecta'], 'redes-col': ['redes_colecta', 'colecta_marcas', 'scanntech']};
const FONTES_PADRAO = ['colecta', 'mtrix'];
function mesEsperado() {   // AAAAMM do último mês fechado que o site precisa ter: a partir do dia 8, o mês anterior
  const h = new Date(); let a = h.getFullYear(), m = h.getMonth() + 1 - (h.getDate() >= 8 ? 1 : 2); if (m <= 0) { m += 12; a--; }
  return `${a}${String(m).padStart(2, '0')}`;
}
const amTxt = am => `${mes(+am.slice(4))}/${am.slice(2, 4)}`;
const fonte = k => ((DSO.atualizacao || {}).fontes || []).find(f => f.id === k) || null;
const fontesDaPagina = (pg = S.page) => (FONTES_PG[pg] || FONTES_PADRAO).map(fonte).filter(Boolean);
const fechadoFonte = f => f.fechado || f.ate;   // a régua compara o último mês FECHADO: o parcial não conta
const estadoFonte = f => (f.congelada ? 'flat' : fechadoFonte(f) < mesEsperado() ? 'warn' : f.parcial ? 'parc' : 'ok');
const faltaFonte = f => `Falta ${f.parcial && f.ate === mesEsperado() ? 'fechar ' : ''}${amTxt(mesEsperado())}`;
function quandoFonte(f, curto) {   // "extraído em 22/10/2026 · out/26 parcial até 21/10"; curto: "extraído em 22/10, out/26 parcial até 21/10"
  if (f.congelada) return `base encerrada, dado até ${f.ate_txt}`;
  const ext = f.extraido ? `extraído em ${curto ? f.extraido.slice(0, 5) : f.extraido}` : '';
  return [ext, f.parcial ? `${f.ate_txt} parcial até ${f.ate_dia.slice(0, 5)}` : `dado até ${f.ate_txt}`].filter(Boolean).join(curto ? ', ' : ' · ');
}
const avisoFonte = f => (estadoFonte(f) === 'warn' ? `Desatualizado: ${faltaFonte(f).toLowerCase()}. ` : '') + (f.obs || '');
function faixaFontes() {   // selos "Dados de" logo abaixo do título de cada página do Sell Out, com a nota do mês parcial
  const L = MODO === 'so' ? fontesDaPagina() : []; if (!L.length) return '';
  const np = notaParcial();
  return `<div class="fontes"><span class="fontes-lab">Dados de</span>` +
    L.map(f => `<span class="selo ${estadoFonte(f)}" title="${esc(avisoFonte(f))}">${esc(f.nome)} · ${esc(quandoFonte(f))}</span>`).join('') +
    `<span class="fontes-site">site publicado em ${esc(DSO.gerado.split(' ')[0])}</span>${np ? `<span class="fontes-nota">${esc(np)}</span>` : ''}</div>`;
}
const topoFontes = () => (DSO.atualizacao ? ['Sell Out', ...['scanntech'].map(fonte).filter(f => f && f.extraido).map(f => `${f.nome} de ${f.extraido.slice(0, 5)}`), `site de ${DSO.gerado.slice(0, 5)}`].join(' · ')
  : `Atualizado em ${DSO.gerado.split(' ')[0]} · Sell Out`);   // arquivo antigo, sem a data das fontes: o texto de antes

/* ---------- mês parcial do Sell Out: o mês em curso entra na base marcado como parcial ----------
   base (Colecta por segmento) = DSO.parcial; redes = a fonte da página. Sell In nunca marca. */
const PARC_PG = {'redes-scan': 'scanntech', 'redes-col': 'redes_colecta'};
const ULT_RD = {scanntech: ['ult_scan'], scanntech_marcas: ['ult_scanm', 'ult_scan'], redes_colecta: ['ult_col'], colecta_marcas: ['ult_colm', 'ult_col']};
const ultRd = k => String((ULT_RD[k] || []).map(x => RD && RD[x]).find(Boolean) || '');   // último mês (AAAAMM) que a base de redes tem desta fonte
let FR = null;   // fonte de redes da conta em curso (scanntech, scanntech_marcas, redes_colecta, colecta_marcas); null = a da página
const emFonte = (k, fn) => { const o = FR; FR = k; try { return fn(); } finally { FR = o; } };
const kPadrao = () => FR || PARC_PG[S.page] || 'base';
function parcialDe(k = kPadrao()) {   // {mes, ate: 'DD/MM'} do mês parcial da série, ou null
  if (MODO !== 'so') return null;
  if (k === 'base') return DSO.parcial && DSO.parcial.mes === DSO.ult26 ? DSO.parcial : null;
  const f = fonte(k), ult = RD ? ultRd(k) : '';
  return f && f.parcial && f.ate === ult && f.ate.startsWith('2026') ? {mes: +f.ate.slice(4), ate: f.ate_dia.slice(0, 5)} : null;
}
function corteDe(k = kPadrao()) {   // último mês de 2026 do acumulado e da tendência: o corte do site, limitado ao último mês da fonte (mês que a fonte não tem não entra como zero)
  const u = k !== 'base' ? ultRd(k) : '';
  return u.startsWith('2026') ? Math.min(S.corte, +u.slice(4)) : S.corte;
}
function fimSerie(k = kPadrao()) {   // até onde vai a série mês a mês: o corte e, quando ele é o último mês fechado, também o mês parcial, marcado
  const c = corteDe(k), p = parcialDe(k);
  return p && p.mes === c + 1 ? p.mes : c;
}
const cR = () => corteDe(FR || 'base');   // corte da conta em curso (nas redes, o da fonte)
const ehParcial = (m, ano = 2026, k) => { const p = ano === 2026 ? parcialDe(k) : null; return !!p && m === p.mes && m <= fimSerie(k); };   // o mês parcial aparece no corte ou logo depois dele
const marcaParc = (m, ano = 2026, k) => (ehParcial(m, ano, k) ? '*' : '');
const mesRot = (m, ano = 2026, k) => MESES[m - 1] + marcaParc(m, ano, k);   // rótulo de mês nos eixos e tabelas: OUT* no mês parcial
const corteRot = () => { const p = parcialDe('base'); return `${mes(S.corte)}/26${ehParcial(S.corte, 2026, 'base') ? ` (parcial até ${p.ate})` : ''}`; };
function notaParcial(k) {
  const p = parcialDe(k); if (!p || p.mes > fimSerie(k)) return '';
  return p.mes > corteDe(k) ? `* ${mes(p.mes)}/26 parcial até ${p.ate}: aparece só na série mês a mês; o acumulado e a tendência vão até ${mes(corteDe(k))}/26, último mês fechado.`
    : `* ${mes(p.mes)}/26 parcial até ${p.ate}: comparar com ${mes(p.mes)}/25 inteiro subestima o mês.`;
}

/* ---------- barra global e segmentações ---------- */
function nav() {
  const topo = document.getElementById('topo');
  if (topo) topo.innerHTML = `<div class="topo-in"><a class="topo-tit" href="#${T('inicio', 'si-inicio')}" data-act="pg" data-pg="${T('inicio', 'si-inicio')}"><h1>Governança CTO</h1></a>
    <div class="topo-meio">${seloValidade()}<span>${MODO === 'so' ? esc(topoFontes()) : `Atualizado em ${D.gerado.split(' ')[0]} · Sell In`}</span>${window.DASH_COFRE ? '<a href="#sair" data-act="sair" title="Fechar o acesso neste aparelho">Sair</a>' : ''}</div>
    <div class="topo-logo"><img src="assets/reckitt_logo.png" alt="Reckitt"></div></div>`;
  const atual = PAI[S.page] || S.page;
  document.getElementById('gnav').innerHTML = '<div class="nav-rol">' + NAV.filter(([, so, si]) => (MODO === 'si' ? si : so || (DSI && si))).map(([n, so, si]) => {
    const alvo = MODO === 'si' ? si : (so || si), on = atual === so || atual === si;
    return `<a class="nav ${on ? 'on' : ''} ${n === 'RV' ? 'rv' : ''}" href="#${alvo}" data-act="pg" data-pg="${alvo}">${n}</a>`;
  }).join('') + `</div><span class="acoes"><button class="btn-top" data-act="apres" title="Abre a página aberta como slides, no recorte marcado"><span class="lg">Modo Apresentação</span><span class="sm">Slides</span></button>
    <button class="btn-top" data-act="pdf" title="Gera a apresentação em PDF da página aberta, no recorte marcado">⤓ PDF</button>
    <button class="btn-top" data-act="excel" title="Baixa um Excel com as tabelas desta página, no recorte marcado">⤓ Excel</button></span>`;
}
function opcoes(k) {
  let ids = dic[k].map((_, i) => i);
  if (k === 'marca') ids = ids.filter(i => i !== TODAS);
  if (k === 'segmento') {
    const mk = gMarcas(), ok = new Set(D.rows.filter(r => r[COL.nivel] === NIV.SEG && (!mk || mk.has(r[COL.marca]))).map(r => r[COL.segmento]));
    ids = ids.filter(i => i !== TODOS && ok.has(i));
  }
  if (k === 'nivel') return ids;
  const lab = i => dic[k][i];
  return ids.sort((a, b) => lab(a).localeCompare(lab(b), 'pt-BR'));
}
function fbar() {
  const ativo = FILTROS.some(([k]) => S.f[k].size);
  document.getElementById('fbar').innerHTML = `<label class="cut">Mês de corte <select data-act="corte">${ate(D.ult26).map(m => `<option value="${m}" ${m === S.corte ? 'selected' : ''}>${mes(m)}/26${parcialDe('base') && parcialDe('base').mes === m ? ' (parcial)' : ''}</option>`).join('')}</select></label>` +
    (DSI ? `<span class="modo" role="tablist" aria-label="Perna"><button data-act="modo" data-m="so" class="${MODO === 'so' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'so'}">Sell Out</button><button data-act="modo" data-m="si" class="${MODO === 'si' ? 'on' : ''}" role="tab" aria-selected="${MODO === 'si'}">Sell In</button></span>` : '') +
    FILTROS.map(([k, n]) => {
      const st = S.f[k];
      const txt = st.size === 1 ? (k === 'grp' || k === 'executivo' ? tit(dic[k][[...st][0]]) : esc(dic[k][[...st][0]])) : n;
      return `<button class="chip ${st.size ? 'on' : ''}" data-act="pop" data-k="${k}">${txt}${st.size > 1 ? ` <span class="n">${st.size}</span>` : ''} <span aria-hidden="true">▾</span></button>`;
    }).join('');
  // faixa "Filtros:": cada seleção vira uma etiqueta que sai com um clique
  const tags = FILTROS.flatMap(([k, n]) => [...S.f[k]].map(i => `<button class="ftag" data-act="rmf" data-k="${k}" data-i="${i}" title="Tirar este filtro">${n}: ${k === 'grp' || k === 'executivo' ? tit(dic[k][i]) : esc(dic[k][i])} <span aria-hidden="true">×</span></button>`));
  const fs = document.getElementById('fsel');
  if (fs) fs.innerHTML = `<span class="fsel-lab">Filtros:</span><div class="fsel-box">${tags.join('') || '<span class="vazio">Nenhum filtro: visão completa da regional.</span>'}</div>
    <button class="chip clear" data-act="limpar" ${ativo ? '' : 'disabled'}>Limpar</button>`;
}
let POP = null;
function abrirPop(k, btn) {
  fecharPop();
  const nome = FILTROS.find(f => f[0] === k)[1], ids = opcoes(k);
  const el = document.createElement('div'); el.className = 'pop';
  el.innerHTML = `<header>${nome}<button data-act="popclear">Limpar</button></header>${ids.length > 8 ? '<input type="search" placeholder="Buscar">' : ''}
    <div class="opts">${ids.map(i => `<label class="opt"><input type="checkbox" value="${i}" ${S.f[k].has(i) ? 'checked' : ''}>${k === 'grp' || k === 'executivo' ? tit(dic[k][i]) : esc(dic[k][i])}</label>`).join('')}</div>`;
  document.body.appendChild(el);
  const r = btn.getBoundingClientRect();
  el.style.top = (r.bottom + 8) + 'px'; el.style.left = Math.max(8, Math.min(r.left, innerWidth - el.offsetWidth - 8)) + 'px';
  el.addEventListener('change', e => {
    const i = +e.target.value; e.target.checked ? S.f[k].add(i) : S.f[k].delete(i);
    if (k === 'marca') { const ok = new Set(opcoes('segmento')); S.f.segmento.forEach(s => { if (!ok.has(s)) S.f.segmento.delete(s); }); }
    atualizar(true);
  });
  el.addEventListener('click', e => {
    if (e.target.dataset.act === 'popclear') { S.f[k].clear(); el.querySelectorAll('input[type=checkbox]').forEach(c => (c.checked = false)); atualizar(true); }
  });
  const busca = el.querySelector('input[type=search]');
  if (busca) {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) busca.focus();
    busca.addEventListener('input', () => { const q = semAcento(busca.value); el.querySelectorAll('.opt').forEach(o => { o.hidden = !semAcento(o.textContent).includes(q); }); });
  }
  POP = {el, k};
}
function fecharPop() { if (POP) { POP.el.remove(); POP = null; } }
document.addEventListener('click', e => {
  if (e.target.closest('#apres, #impressao')) return;
  const t = e.target.closest('[data-act]');
  if (POP && !e.target.closest('.pop') && !(t && t.dataset.act === 'pop')) fecharPop();
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'pop') { if (POP && POP.k === t.dataset.k) fecharPop(); else abrirPop(t.dataset.k, t); }
  else if (act === 'limpar') { FILTROS.forEach(([k]) => S.f[k].clear()); atualizar(); }
  else if (act === 'rmf') { const k = t.dataset.k; S.f[k].delete(+t.dataset.i); if (k === 'marca') { const ok = new Set(opcoes('segmento')); S.f.segmento.forEach(x => { if (!ok.has(x)) S.f.segmento.delete(x); }); } atualizar(); }
  else if (act === 'apres') abrirApresentacao();
  else if (act === 'pdf') gerarPDF(t);
  else if (act === 'med') { S.ui['m' + t.dataset.bid] = t.dataset.m; document.getElementById('b-' + t.dataset.bid).innerHTML = blocoIn(t.dataset.bid); }
  else if (act === 'ui') {
    S.ui[t.dataset.k] = t.dataset.v; if (t.dataset.k === 'bnv') S.ui.pag = 0; render(false);
    if ((t.dataset.k === 'scsel' || t.dataset.k === 'clsel' || t.dataset.k.startsWith('sel')) && t.dataset.v) { const d = document.querySelector('#app .det'); if (d) { const off = document.querySelector('.gnav').offsetHeight + document.querySelector('.fbar').offsetHeight + 12; scrollTo({top: d.getBoundingClientRect().top + scrollY - off}); } }
  }
  else if (act === 'pg') { e.preventDefault(); irPara(t.dataset.pg); }
  else if (act === 'modo') { if (t.dataset.m !== MODO) irPara(t.dataset.m === 'si' ? 'si-inicio' : 'inicio'); }
  else if (act === 'excel') exportarExcel(t);
  else if (act === 'csv') baixarCSV(t);
  else if (act === 'sair') { e.preventDefault(); try { localStorage.removeItem('dash-geral-cto-chave'); } catch (x) { /* nada guardado */ } location.replace(location.pathname); }
  else if (act === 'pag') { const np = Math.max(1, Math.ceil(linhasBase().length / 50)); S.ui.pag = Math.min(np - 1, Math.max(0, (S.ui.pag || 0) + +t.dataset.d)); render(false); }
  else if (act === 'sort') { const k = 'sort' + t.dataset.t; S.ui[k] = S.ui[k] === t.dataset.c ? '-' + t.dataset.c : t.dataset.c; render(false); }
});
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'corte') { S.corte = +e.target.value; atualizar(); }
});
function irPara(pg) {
  fecharPop();
  const mudou = pg !== S.page, m = modoDaPagina(pg);
  if (m !== MODO) { aplicarModo(m); filtrar(); fbar(); }
  S.page = pg; S.ui.pag = 0; gravarHash(mudou); render(); scrollTo({top: 0});
}
function atualizar(manterPop) {
  S.ui.pag = 0; filtrar(); gravarHash(); fbar(); render(false);
  if (manterPop && POP) { const btn = document.querySelector(`.chip[data-k="${POP.k}"]`); if (btn) { const r = btn.getBoundingClientRect(); POP.el.style.top = (r.bottom + 8) + 'px'; } }
}
// voltar/avançar do navegador e links colados: relê o endereço
var ULTIMO = location.hash;
function doEndereco() {
  if (ART || location.hash === ULTIMO) return;
  ULTIMO = location.hash; const antes = S.page; fecharPop(); if (APRES) fecharApresentacao();
  lerHash(); filtrar(); gravarHash(); fbar(); render(); if (S.page !== antes) scrollTo({top: 0});
}
addEventListener('hashchange', doEndereco);
addEventListener('popstate', doEndereco);
// gráficos acompanham a largura da tela
let LARG = innerWidth, tRz = null;
addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => { if (Math.abs(innerWidth - LARG) > 60) { LARG = innerWidth; render(false); } }, 200); });

/* ---------- páginas (mesma ordem das abas do Dash Power Query) ---------- */
function hero(eyebrow, t1, t2, side = '') {
  return `<section class="hero${eyebrow ? ' sm' : ''}"><div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${t1} <span>${t2}</span></h1>${faixaFontes()}</div>${side}</section>`;
}
const recorteResumo = () => FILTROS.filter(([k]) => S.f[k].size).map(([k, n]) => `${n}: ${[...S.f[k]].map(i => tit(dic[k][i])).join(', ')}`).join(' · ');
function recorteTxt() { return ''; }   // o recorte aparece na faixa "Filtros:" do topo, nos slides e no Excel

function pgInicio() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  const side = `<div class="side">${(D.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Corte ${corteRot()} · ${n0(D.rows.length)} linhas na base</div>`;
  let h = hero('', 'Governança CTO.', 'Sell out do Centro-Oeste, mês a mês.', side);
  // linha de marcas
  const pn = [['geral', 'Total', null], ...['VEJA','VANISH','HARPIC','FINISH'].map(m => [m.toLowerCase(), tit(m), [m]]), ['hn', 'H&N', ['SUSTAGEN','JONTEX','OLLA','VEET']]];
  h += '<div class="pnav">' + pn.map(([pg, nome, mk]) => {
    const a = um('rs', {marcas: mk ? marcasDe(mk) : op.marcas, segs: op.segs}); const d = varr(ytd(a, 2026, 'rs'), ytd(a, 2025, 'rs'));
    return `<a href="#${pg}" data-act="pg" data-pg="${pg}"><div class="mk ${mkCls(mk && mk[0])}">${nome}</div><div class="v">${mi(ytd(a, 2026, 'rs'))} · ${vc(d)}</div></a>`;
  }).join('') + '</div>';
  h += recorteTxt();
  h += `<h2 class="sec">O ano em números. <span>Acumulado de ${corteTxt()} contra o mesmo período de 2025.</span></h2>` + kpis(op);
  // prateleira de marcas
  const MK = ['VEJA','VANISH','HARPIC','FINISH','SUSTAGEN','JONTEX','OLLA','VEET'];
  const R = cubo('rs', {chave: r => r[COL.marca], segs: op.segs});
  h += `<h2 class="sec">As marcas. <span>Cada uma com a sua curva.</span></h2><div class="shelf">` + MK.map(m => {
    const a = R.get(id('marca', m)); if (!a) return '';
    const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs');
    const pg = MARCA_PAG[m.toLowerCase()] ? m.toLowerCase() : 'hn';
    return `<a class="card" href="#${pg}" data-act="pg" data-pg="${pg}"><p class="eyebrow ${mkCls(m)}">${tit(m)}</p><div class="kpi"><div class="val" style="font-size:30px">${mi(y26)}</div>
      <div class="sub">${vc(varr(y26, y25))} sobre 2025</div></div>${chart(a, 'rs', 120, 244, false).replace(/<div class="legend">.*<\/div>$/, '')}</a>`;
  }).join('') + '</div>';
  // prateleira de distribuidores
  const G = cubo('rs', {...op, chave: r => r[COL.grp]});
  const gl = [...G.entries()].map(([k, a]) => ({k, y26: ytd(a, 2026, 'rs'), y25: ytd(a, 2025, 'rs')})).filter(x => isFinite(x.y26)).sort((a, b) => b.y26 - a.y26);
  h += `<h2 class="sec">Os distribuidores. <span>Quem puxa e quem segura o ano.</span></h2><div class="shelf">` + gl.map(x => {
    const nome = dic.grp[x.k], uf = D.depara.find(d => d.grp === nome);
    return `<div class="card kpi"><p class="eyebrow">${uf ? uf.uf + ' · ' + tit(uf.canal) : ''}</p><h3>${tit(nome)}</h3><div class="val" style="font-size:28px">${mi(x.y26)}</div>
      <div class="sub">${vc(varr(x.y26, x.y25))} sobre 2025${uf ? ' · ' + uf.executivo : ''}</div></div>`;
  }).join('') + '</div>';
  // índice
  const IDX = [['geral','Dados gerais','Total da carteira: R$, caixas e PDVs mês a mês, ticket, R$ por caixa, marca a marca, UF contra UF e distribuidor a distribuidor.'],
    ['veja','Veja','Visão marca e segmentos: VMU, VLP, VPS, Cozinha, Banheiro, Vidros, Desinfetante e Gel.'],
    ['vanish','Vanish','Visão marca e segmentos: Líquido, Pó, Barra e Outros.'],
    ['harpic','Harpic','Visão marca e segmentos: Pedra, Pastilha, Caixa Acoplada, Líquido, Fresh Power 6, Bloco e Click Gel.'],
    ['finish','Finish','Visão marca e segmentos: Pó, Secante e Tabletes.'],
    ['hn','H&N','Health & Nutrition: Sustagen, Bem Estar Sexual (Jontex + Olla) e Veet.'],
    ['diretor','Visão do Diretor','Distribuidor x marca x ano, no acumulado.'],
    ['clientes','Clientes','Curvas por distribuidor, quem soma e quem tira do ano, e as abas das redes compradoras.'],
    ['executivos','Executivos','As mesmas curvas por executivo, com os distribuidores de cada carteira.'],
    ['redes-scan','Redes Scanntech','Redes de varejo: Reckitt, mercado e share por rede e UF, quem cresce e quem cai, mês a mês.'],
    ['redes-col','Redes Colecta','Redes que compram dos distribuidores, por executivo, UF e distribuidor, cruzadas com a Scanntech.'],
    ['confronto','Confronto de fontes','MTRIX x Colecta nos mesmos meses, distribuidor, marca e segmento.'],
    ['depara','De-para','Hierarquia, fonte por período e a régua única de segmentos.'],
    ['base','Base geral','A base longa que alimenta tudo, filtrada pelas segmentações, com download em CSV.']];
  h += `<h2 class="sec">O índice. <span>Na mesma ordem das abas do Dash Power Query.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como usar as segmentações. <span>As mesmas regras do Excel.</span></h2><div class="card"><ol class="num">
    <li>As segmentações no topo valem para o site inteiro: marcar GO em Veja filtra também Dados gerais, Vanish e o resto. ${ART ? 'O recorte fica lembrado neste navegador na próxima vez que você abrir o link.' : 'O link da página guarda o recorte, então dá para mandar a visão já filtrada.'}</li>
    <li>Marca e Segmento: escolha Veja e depois Cozinha para ver só Veja Cozinha. Sem marca marcada, a positivação vem do total do distribuidor, sem soma dupla.</li>
    <li>Comparabilidade: "1. Mesma régua" mostra só os meses em que os dois anos vêm da mesma ferramenta (a leitura mais limpa de crescimento). Marque 1 e 2 para a série emendada. "3. Fora da janela" são meses que um dos anos não tem.</li>
    ${(D.regras || []).map(r => `<li>${esc(r)}</li>`).join('')}</ol></div>`;
  return h;
}

function pgGeral() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('Dados gerais', 'Total da carteira.', 'Sell out do canal indireto CTO, em R$, caixas e PDVs, mês a mês.') + recorteTxt() + kpis(op);
  h += `<h2 class="sec">Visão total. <span>Os três blocos do Power Query num card só.</span></h2>` + bloco('geral', 'Total', op);
  // ticket e R$ por caixa
  const r = um('rs', op), c = um('cx', op), p = um('pdv', op);
  const div = (a, b) => { const o = new Float64Array(48).fill(NaN); for (let i = 0; i < 48; i++) o[i] = a[i] / b[i]; return o; };
  const tk = div(r, p), rc = div(r, c);
  const mini = (a, den, t, sub) => `<div class="card"><p class="eyebrow">${t}</p><h3>R$ ${n2(agg(r, 2026, ate(S.corte), false) / agg(den, 2026, ate(S.corte), false))} no acumulado. <span>${sub}</span></h3><div class="tw"><table><thead><tr><th>Mês</th>${ANOS.map(y => `<th>${y}</th>`).join('')}<th>26 vs 25</th></tr></thead><tbody>` +
    ate(12).map(m => `<tr><td class="b">${mesRot(m)}</td>${ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n2(v(a, y, m))}</td>`).join('')}<td>${vcm(varr(v(a, 2026, m), v(a, 2025, m)), m)}</td></tr>`).join('') + '</tbody></table></div></div>';
  h += `<h2 class="sec">Ticket e R$ por caixa. <span>Quanto cada PDV compra e quanto vale cada caixa.</span></h2><div class="grid g2">` +
    mini(tk, p, 'Ticket médio · R$ por PDV', 'Por PDV positivado no mês.') + mini(rc, c, 'R$ por caixa', 'Caixas não comparam entre ferramentas.') + '</div>';
  const MK = dic.marca.map((m, i) => [i, tit(m)]).filter(([i]) => i !== TODAS);
  h += `<h2 class="sec">Marca a marca. <span>Acumulado de ${corteTxt()}.</span></h2><div class="card">` + tabelaYTD('Marca', MK, r => r[COL.marca], op, true) + '</div>';
  const UFS = ['DF','GO','MS','MT','TO','PA'].map(u => [id('uf', u), u]);
  h += `<h2 class="sec">UF contra UF. <span>PA é o JC PA, fora da Área 7.</span></h2><div class="card">` + tabelaYTD('UF', UFS, r => r[COL.uf], op) + '</div>';
  const GR = D.depara.map(d => [id('grp', d.grp), tit(d.grp), d.uf]);
  h += `<h2 class="sec">Distribuidor a distribuidor. <span>Ordenado pelo sell out de 2026.</span></h2><div class="card">` + tabelaYTD('Grp. econômico', GR, r => r[COL.grp], op) + '</div>';
  return h;
}

function segsDaMarca(nomes) {
  const mk = marcasDe(nomes), s = new Set();
  D.rows.forEach(r => { if (r[COL.nivel] === NIV.SEG && mk.has(r[COL.marca])) s.add(r[COL.segmento]); });
  return [...s];
}
function secaoMarca(chave, rotulo, nomes) {
  const mk = marcasDe(nomes), segsG = gSegs(), op = {marcas: mk, segs: segsG};
  let h = kpis(op) + `<h2 class="sec">${tit(rotulo)} · visão marca. <span>${T('R$, caixas e PDVs mês a mês.', 'NR e caixas mês a mês.')}</span></h2>` + bloco(chave, tit(rotulo), op);
  // matriz segmento x mês
  const med = MED[S.ui['mat' + chave]] ? S.ui['mat' + chave] : 'rs';
  const segs = segsDaMarca(nomes).filter(s => !segsG || segsG.has(s));
  const C = cubo(med, {marcas: mk, segs: segsG || new Set(segsDaMarca(nomes)), chave: r => r[COL.segmento]});   // matriz sempre no nível segmento
  const L = segs.map(s => ({s, a: C.get(s)})).filter(x => x.a).map(x => ({...x, y25: ytd(x.a, 2025, med), y26: ytd(x.a, 2026, med)})).sort((a, b) => (b.y26 || 0) - (a.y26 || 0));
  const botoesMat = `<div class="seg">${Object.keys(MED).map(k => `<button data-act="ui" data-k="mat${chave}" data-v="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>`;
  if (!L.length) return h + `<div class="card">${botoesMat}<div class="empty">Sem segmento para este recorte.</div></div>`;
  const tot = new Float64Array(48).fill(NaN);
  L.forEach(x => x.a.forEach((val, i) => { if (!isNaN(val)) tot[i] = (isNaN(tot[i]) ? 0 : tot[i]) + val; }));
  const TT = {s: -1, a: tot, y25: ytd(tot, 2025, med), y26: ytd(tot, 2026, med)};
  const media = MED[med].media, nomeS = s => (s < 0 ? 'Total' : tit(dic.segmento[s]));
  const meses = [...ate(12).map(m => [2025, m]), ...ate(12).map(m => [2026, m])];
  h += `<h2 class="sec">Segmentos mês a mês. <span>${med === 'pdv' ? 'PDVs somam segmentos (o mesmo PDV aparece em mais de um).' : 'Peso de cada segmento no acumulado de 2026.'}</span></h2><div class="card">
    ${botoesMat}
    <div class="tw"><table><thead><tr><th>Segmento</th>${meses.map(([y, m]) => `<th>${MESES[m - 1]}/${String(y).slice(2)}${marcaParc(m, y)}</th>`).join('')}<th>${media ? 'Média' : 'YTD'} 25</th><th>${media ? 'Média' : 'YTD'} 26</th><th>26 vs 25</th>${media ? '' : '<th>Peso 26</th>'}</tr></thead><tbody>` +
    [...L, TT].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>${meses.map(([y, m]) => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(x.a, y, m))}</td>`).join('')}
      <td>${n0(x.y25)}</td><td class="b">${n0(x.y26)}</td><td>${vc(varr(x.y26, x.y25))}</td>${media ? '' : `<td>${p1(x.y26 / TT.y26)}</td>`}</tr>`).join('') + '</tbody></table></div>';
  // trimestres
  h += `<p class="eyebrow" style="margin-top:26px">Trimestres · ${MED[med].nome}</p><div class="tw"><table><thead><tr><th>Segmento</th>` +
    [1, 2, 3, 4].map(q => { const ms = [q * 3 - 2, q * 3 - 1, q * 3], pq = ms.some(m => ehParcial(m)) ? '*' : '', pd = ms.some(m => ehParcial(m) && m <= S.corte) ? '*' : ''; return `<th>Q${q}'25</th><th>Q${q}'26${pq}</th><th>Desvio Q${q}${pd}</th>`; }).join('') + `${media ? '' : '<th>Peso seg.</th>'}<th>YTD</th></tr></thead><tbody>` +
    [...L, TT].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>` + [1, 2, 3, 4].map(q => {
      const ms = [q * 3 - 2, q * 3 - 1, q * 3], ok = ms.filter(m => m <= S.corte && isFinite(v(x.a, 2026, m)));
      const a26 = agg(x.a, 2026, ms, media), a25 = agg(x.a, 2025, ms, media), d = ok.length ? varr(agg(x.a, 2026, ok, media), agg(x.a, 2025, ok, media)) : NaN;
      return `<td>${n0(a25)}</td><td class="b">${n0(a26)}</td><td>${vc(d)}</td>`;
    }).join('') + `${media ? '' : `<td>${p1(x.y26 / TT.y26)}</td>`}<td class="b">${vc(varr(x.y26, x.y25))}</td></tr>`).join('') + '</tbody></table></div>' +
    `<p class="note" style="margin:10px 0 0">O desvio do trimestre compara só os meses de 2026 ${parcialDe() && parcialDe().mes <= S.corte ? 'até o corte' : 'já fechados'} contra os mesmos meses de 2025.${notaParcial() ? ' ' + esc(notaParcial()) : ''}</p></div>`;
  // segmento a segmento
  const RS_ = med === 'rs' ? C : cubo('rs', {marcas: mk, segs: segsG, chave: r => r[COL.segmento]});
  const ordem = L.map(x => x.s);
  let sel = +(S.ui['sg' + chave] ?? ordem[0]); if (!ordem.includes(sel)) sel = ordem[0];
  h += `<h2 class="sec">Segmento a segmento. <span>Escolha o segmento para abrir ${T('R$, caixas e PDVs', 'NR e caixas')}.</span></h2><div class="shelf">` + ordem.map(s => {
    const a = RS_.get(s); if (!a) return ''; const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs');
    return `<button class="card kpi" data-act="ui" data-k="sg${chave}" data-v="${s}" style="border:0;text-align:left;cursor:pointer;flex-basis:220px;${s === sel ? 'box-shadow:inset 0 0 0 2px #1D1D1F' : ''}">
      <div class="lab">${tit(dic.segmento[s])}</div><div class="val" style="font-size:26px">${mi(y26)}</div><div class="sub">${vc(varr(y26, y25))} sobre 2025</div></button>`;
  }).join('') + '</div>';
  h += bloco(chave + '_s' + sel, `${tit(rotulo)} · ${tit(dic.segmento[sel])}`, {marcas: mk, segs: new Set([sel])});
  if (MODO === 'si') {   // Sell In: curvas por cliente dentro da marca
    const Lc = curvasDados(r => r[COL.grp], op);
    h += `<h2 class="sec">Cliente a cliente em ${tit(rotulo)}. <span>Quem cresce e quem cai na marca, com o plano do Q4. Clique no nome para abrir.</span></h2>` + termometro(Lc.map(x => ({v: x.d}))) +
      `<div class="card">${tabelaCurvas('mk' + chave, 'Cliente', Lc, k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? esc(d.executivo) : ''; })}</div>`;
    const sl = S.ui['selmk' + chave];
    if (sl !== undefined && sl !== '' && Lc.some(x => String(x.k) === String(sl))) h += detalheChave('mk' + chave, +sl, COL.grp, `${tit(dic.grp[+sl])} · ${tit(rotulo)}`, op);
  }
  return h;
}
function pgMarca(pg) {
  const nome = MARCA_PAG[pg][0];
  const sub = {VEJA: 'Multiuso, limpeza pesada, cozinha, banheiro e vidros.', VANISH: 'Tira manchas em líquido, pó e barra.', HARPIC: 'Cuidado do vaso: pedra, pastilha, caixa acoplada e líquido.', FINISH: 'Lava-louças: pó, secante e tabletes.'}[nome];
  return hero(`<span class="${mkCls(nome)}">${tit(nome)}</span>`, `${tit(nome)}.`, sub) + recorteTxt() + secaoMarca(pg, nome, MARCA_PAG[pg]);
}
function pgHN() {
  let h = hero('H&N', 'Health & Nutrition.', T('Sustagen, Bem Estar Sexual (Jontex + Olla) e Veet.', 'Jontex e Olla, Sustagen, Veet e as outras marcas de Health, com o AR do Q4 de H&N.')) + recorteTxt();
  h += `<div class="pills">${HN.map(([r], i) => `<button data-act="ui" data-k="hn" data-v="${i}" class="${+(S.ui.hn || 0) === i ? 'on' : ''}">${tit(r)}</button>`).join('')}</div>`;
  const [rot, mks] = HN[+(S.ui.hn || 0)];
  return h + secaoMarca('hn' + (S.ui.hn || 0), rot, mks);
}

function pgDiretor() {
  const segs = gSegs(), MK = ['VEJA','VANISH','HARPIC','FINISH'], si = MODO === 'si';
  const R = cubo('rs', {segs, chave: r => r[COL.grp] + '|' + r[COL.marca]});
  const RT = cubo('rs', {marcas: gMarcas(), segs, chave: r => r[COL.grp]}), CT = cubo('cx', {marcas: gMarcas(), segs, chave: r => r[COL.grp]});
  const PT = si ? cuboP('rs', {marcas: gMarcas(), segs, chave: r => r[COL.grp]}) : new Map();
  const y = (a, yr) => (a ? agg(a, yr, ate(S.corte), false) : NaN);
  const linhas = D.depara.map(d => {
    const g = id('grp', d.grp);
    const cols = MK.map(m => [y(R.get(g + '|' + id('marca', m)), 2025), y(R.get(g + '|' + id('marca', m)), 2026)]);
    cols.push([y(RT.get(g), 2025), y(RT.get(g), 2026)], [y(CT.get(g), 2025), y(CT.get(g), 2026)]);
    if (si) cols.push([RT.get(g) ? agg(RT.get(g), 2025, Q4M, false) : NaN, PT.get(g) ? agg(PT.get(g), 2026, Q4M, false) : NaN]);
    return {nome: tit(d.grp), uf: si ? tit(d.uf) : d.uf, cols};
  }).filter(l => l.cols.some(c => isFinite(c[0]) || isFinite(c[1])));
  const tsum = j => [0, 1].map(k => linhas.reduce((s, l) => s + (isFinite(l.cols[j][k]) ? l.cols[j][k] : 0), 0));
  const tot = {nome: T('Total Área 7 + JC PA', 'Total CTO'), uf: '', cols: linhas[0] ? linhas[0].cols.map((_, j) => tsum(j)) : []};
  const sk = S.ui.sortrob || '-5';
  const j = Math.abs(+sk), desc = sk.startsWith('-');
  linhas.sort((a, b) => ((b.cols[j][1] || 0) - (a.cols[j][1] || 0)) * (desc ? 1 : -1));
  const heads = [...MK.map(tit), T('Total R$', 'Total NR'), 'Caixas', ...(si ? ['Q4: plano'] : [])];
  const row = (l, c) => `<tr class="${c || ''}"><td class="l b">${l.nome}</td><td class="l">${l.uf}</td>` + l.cols.map(([a, b]) => `<td>${n0(a)}</td><td class="b">${n0(b)}</td><td>${vc(varr(b, a))}</td>`).join('') + '</tr>';
  return hero('Visão do Diretor', T('Distribuidor x marca.', 'Cliente x marca.'), `Acumulado de ${corteTxt()}, 2025 contra 2026${T('.', '; no fim, o plano do Q4 contra o Q4 de 2025.')}`) + recorteTxt() +
    `<div class="card"><div class="tw"><table><thead><tr><th class="l">${T('Grp. econômico', 'Cliente')}</th><th class="l">${T('UF', 'Canal')}</th>` +
    heads.map((hh, i) => `<th class="sort" data-act="sort" data-t="rob" data-c="${i}" colspan="3" style="text-align:center">${hh} ${Math.abs(+sk) === i ? (desc ? '↓' : '↑') : ''}</th>`).join('') +
    `</tr><tr><th></th><th></th>${heads.map((_, i) => (si && i === heads.length - 1 ? '<th>Q4 2025</th><th>Plano</th><th>Var.</th>' : '<th>2025</th><th>2026</th><th>Var.</th>')).join('')}</tr></thead><tbody>${linhas.map(l => row(l)).join('')}${row(tot, 'tot')}</tbody></table></div>
    <p class="note" style="margin:12px 0 0">Clique no nome da coluna para ordenar pelo valor de 2026${T('', ' (ou do plano)')}. As colunas de marca respeitam o filtro de segmento; ${T('Total R$', 'Total NR')} e Caixas respeitam marca e segmento.</p></div>`;
}

let GRP_INFO = null;
function grpInfo() {   // recorte, executivo e canal de cada distribuidor, para filtrar o confronto
  if (GRP_INFO) return GRP_INFO;
  GRP_INFO = {};
  D.rows.forEach(r => {
    const g = dic.grp[r[COL.grp]], x = GRP_INFO[g] || (GRP_INFO[g] = {recorte: new Set(), executivo: new Set(), canal: new Set()});
    x.recorte.add(r[COL.recorte]); x.executivo.add(r[COL.executivo]); x.canal.add(r[COL.canal]);
  });
  return GRP_INFO;
}
function confLinhas() {
  const nivel = S.ui.cnv || 'TOTAL', busca = semAcento(S.ui.cbusca || ''), G = grpInfo();
  const nomes = k => (S.f[k].size ? new Set([...S.f[k]].map(i => dic[k][i])) : null);
  const uf = nomes('uf'), gr = nomes('grp'), mk = nomes('marca'), sg = nomes('segmento');
  const porGrp = ['recorte', 'executivo', 'canal'].filter(k => S.f[k].size);
  return D.confronto.filter(x => {
    const nv = x.marca === '(TODAS AS MARCAS)' ? 'TOTAL' : x.segmento === '(TODOS OS SEGMENTOS)' ? 'MARCA' : 'SEGMENTO';
    const info = G[x.grp];
    return nv === nivel && (!uf || uf.has(x.uf)) && (!gr || gr.has(x.grp)) && (!mk || nv === 'TOTAL' || mk.has(x.marca)) &&
      (!sg || nv !== 'SEGMENTO' || sg.has(x.segmento)) &&
      porGrp.every(k => info && [...S.f[k]].some(i => info[k].has(i))) &&
      (!busca || semAcento(x.grp + ' ' + x.marca + ' ' + x.segmento).includes(busca));
  });
}
const leitConf = x => { if (x.mx_rs <= 0) return ['Só no Colecta', 'warn']; const q = x.co_rs / x.mx_rs; return q >= 0.95 && q <= 1.05 ? ['Bate (±5%)', 'up'] : q > 1.05 ? ['Colecta mede mais', 'warn'] : ['Colecta mede menos', 'down']; };
function confRes() {
  const nivel = S.ui.cnv || 'TOTAL', L = confLinhas(), bate = L.filter(x => leitConf(x)[0].startsWith('Bate')).length;
  return `<div class="grid g3"><div class="card kpi"><div class="lab">Comparações</div><div class="val">${n0(L.length)}</div><div class="sub">no nível ${nivel.toLowerCase()}</div></div>
     <div class="card kpi"><div class="lab">Batem em ±5%</div><div class="val">${n0(bate)}</div><div class="sub">${L.length ? p1(bate / L.length) + ' das comparações' : 'nada neste recorte'}</div></div>
     <div class="card kpi"><div class="lab">Regra adotada</div><div class="val" style="font-size:22px;line-height:1.3">Colecta é o padrão</div><div class="sub">MTRIX onde o Colecta não tem o dado</div></div></div>
    <div class="card"><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th><th class="l">Período</th><th>Meses</th><th class="l">Marca</th><th class="l">Segmento</th>
      <th>R$ MTRIX</th><th>R$ Colecta</th><th>Colecta / MTRIX</th><th>PDVs/mês MTRIX</th><th>PDVs/mês Colecta</th><th>Colecta / MTRIX</th><th class="l">Leitura</th><th class="l">Fonte adotada</th></tr></thead><tbody>` +
    (L.map(x => { const [t, c] = leitConf(x); return `<tr><td class="l b">${tit(x.grp)}</td><td class="l">${x.uf}</td><td class="l">${x.periodo}</td><td>${x.meses}</td><td class="l ${mkCls(x.marca)}">${tit(x.marca)}</td><td class="l">${tit(x.segmento)}</td>
      <td>${n0(x.mx_rs)}</td><td>${n0(x.co_rs)}</td><td class="b">${x.mx_rs ? n2(x.co_rs / x.mx_rs) : ''}</td><td>${n0(x.mx_pdv)}</td><td>${n0(x.co_pdv)}</td><td>${x.mx_pdv ? n2(x.co_pdv / x.mx_pdv) : ''}</td>
      <td class="l ${c}">${t}</td><td class="l">${esc(x.adotada)}</td></tr>`; }).join('') || '<tr><td colspan="14" class="empty">Nada neste recorte.</td></tr>') + '</tbody></table></div></div>';
}
function pgConfronto() {
  const nivel = S.ui.cnv || 'TOTAL';
  const fora = (S.f.fonte.size || S.f.janela.size) ? '<p class="note">Fonte e Comparabilidade não se aplicam aqui: o confronto já compara as duas fontes nos mesmos meses.</p>' : '';
  return hero('Confronto de fontes', 'MTRIX x Colecta.', 'Mesmos meses, mesmo distribuidor. Razão perto de 1,00 = as duas medem igual.') + recorteTxt() + fora +
    `<div class="pills" style="margin-bottom:16px">${['TOTAL','MARCA','SEGMENTO'].map(n => `<button data-act="ui" data-k="cnv" data-v="${n}" class="${n === nivel ? 'on' : ''}">${tit(n)}</button>`).join('')}
      <input class="find" id="cbusca" type="search" placeholder="Buscar distribuidor, marca ou segmento" value="${esc(S.ui.cbusca || '')}" aria-label="Buscar no confronto"></div>
    <div id="conf-res">${confRes()}</div>`;
}

/* ---------- Redes: Scanntech (varejo) e Colecta (clientes dos distribuidores) ---------- */
const RD = D.redes || null;
let RD_ULT = null;
if (RD && RD.scanm) Object.keys(RD.scanm).forEach(k => { RD.scanm[k] = RD.scanm[k].filter(l => l[0] !== 'Tudo' && l[1] !== 'Tudo'); });   // 'Tudo' = total do Tableau
const BASE_COMP = new Set(RD && RD.base_comp ? RD.base_comp : []);
const RM = RD ? RD.meses : [];
const nomeRaiz = r => { if (r === 'DEMAIS') return 'Demais clientes'; if (r === 'PF') return 'Pessoa física e sem CNPJ'; const n = RD.nomes[r] || {}; return (n.fantasia || n.razao || 'CNPJ ' + r); };
const mesesAte = (ano, n) => ate(n).map(m => RM.indexOf(`${ano}${String(m).padStart(2, '0')}`)).filter(i => i >= 0);
const varR = (a, b) => (isFinite(a) && isFinite(b) && b >= 1000 && a > 0 && a / b <= 10 ? a / b - 1 : NaN);   // evita % absurdo sobre base mínima
const rsx = v => (Math.abs(v) >= 1e6 ? mi(v) : 'R$ ' + n0(v));   // R$ Mi só a partir de 1 milhão
const varQ = (a, b) => (isFinite(b) && b >= 1000 && !(a > 0) ? -1 : varR(a, b));   // base relevante e zero agora = parou de vender (-100%)
function parR(arr, ref) {   // soma 26 e 25 só nos meses até o corte (da fonte) com valor nos dois anos (ref decide o pareamento)
  ref = ref || arr; let a = 0, b = 0;
  for (let m = 1, c = cR(); m <= c; m++) { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`);
    if (ref[i5] > 0 && ref[i6] > 0) { a += arr[i6] || 0; b += arr[i5] || 0; } }
  return [a, b];
}
const somaI = (arr, idx) => idx.reduce((s, i) => s + (arr[i] || 0), 0);
const ytdR = (arr, ano) => somaI(arr, mesesAte(ano, cR()));
function triR(arr) {   // últimos 3 meses até o corte (da fonte) contra os 3 anteriores (tendência dentro de 2026)
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
  if (fim < 5) return [NaN, NaN];
  return [somaI(arr, [fim - 2, fim - 1, fim]), somaI(arr, [fim - 5, fim - 4, fim - 3])];
}
function serie48(arr) {
  const a = new Float64Array(48).fill(NaN);
  RM.forEach((m, i) => { const y = +m.slice(0, 4), mo = +m.slice(4); if (arr[i]) a[(y - ANO0) * 12 + mo - 1] = arr[i]; });
  for (let m = fimSerie(FR || undefined); m < 12; m++) a[36 + m] = NaN;   // até o corte da fonte, mais o mês parcial logo depois dele
  return a;
}
const somaArr = (lista, campo) => { const o = new Array(RM.length).fill(0); lista.forEach(x => x[campo].forEach((v, i) => { o[i] += v || 0; })); return o; };
const nomesSel = k => (S.f[k].size ? new Set([...S.f[k]].map(i => dic[k][i])) : null);
const GRUPO_MARCA = m => (['SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'].includes(m) ? 'HN' : m);
const marcasRede = () => (S.f.marca.size ? new Set([...S.f.marca].map(i => GRUPO_MARCA(dic.marca[i]))) : null);
const marcasScan = () => (S.f.marca.size ? new Set([...S.f.marca].map(i => dic.marca[i])) : null);
const temHN = () => [...S.f.marca].some(i => GRUPO_MARCA(dic.marca[i]) === 'HN');
const CRUZ = {};   // 'REDE|UF' -> raízes do Colecta; 'raiz' -> [rede|uf]
if (RD) (RD.cruz || []).forEach(c => { CRUZ[c.rede + '|' + c.uf] = c.raizes; c.raizes.forEach(r => { (CRUZ['r:' + r] = CRUZ['r:' + r] || []).push(c.rede + '|' + c.uf); }); });
function leituraRede(r, m, so, motivo) {
  if (motivo) return motivo;
  if (so) return ['Só Reckitt (rede não libera o mercado)', 'flat'];
  if (r === -1) return ['Parou de vender', 'down'];
  if (!isFinite(r)) return ['Sem base de 2025', 'flat'];
  const cr = r > 0.02 ? 1 : r < -0.02 ? -1 : 0;
  if (!isFinite(m)) return cr > 0 ? ['Cresce', 'up'] : cr < 0 ? ['Cai', 'down'] : ['Estável', 'flat'];
  const d = r - m;
  if (Math.abs(d) <= 0.02) return cr > 0 ? ['Cresce em linha com a rede', 'up'] : cr < 0 ? ['Cai junto com a rede', 'down'] : ['Estável, em linha com a rede', 'flat'];
  if (d > 0) return cr > 0 ? ['Cresce acima da rede (ganha share)', 'up'] : cr === 0 ? ['Estável com a rede caindo (ganha share)', 'flat'] : ['Cai menos que a rede (ganha share)', 'flat'];
  if (cr > 0) return ['Cresce abaixo da rede (perde share)', 'flat'];
  if (cr === 0) return ['Estável com a rede crescendo (perde share)', 'down'];
  return m > 0.02 ? ['Perde share: a rede cresce e a Reckitt cai', 'down'] : ['Cai mais que a rede (perde share)', 'down'];
}
const vpp = d => (isFinite(d) ? `<span class="vbig ${cls(d) || 'flat'}">${d > 0.0005 ? '▲' : d < -0.0005 ? '▼' : '●'} ${d > 0 ? '+' : ''}${nf1.format(d * 100)} pp</span>` : '');
const selo = ([t, c]) => `<span class="vr ${c}">${t}</span>`;
function termometro(itens) {   // quantas crescem, ficam estáveis e caem
  const c = {up: 0, flat: 0, down: 0}; itens.forEach(x => { const v = x.v; if (!isFinite(v)) return; c[v > 0.02 ? 'up' : v < -0.02 ? 'down' : 'flat']++; });
  return `<div class="termo"><span class="vbig up">▲ ${c.up} crescem</span><span class="vbig flat">● ${c.flat} estáveis</span><span class="vbig down">▼ ${c.down} caem</span></div>`;
}
function thSort(t, c, rot, cls = '') { const k = S.ui['sort' + t] || ''; const on = k.replace('-', '') === String(c); return `<th class="sort ${cls}" data-act="sort" data-t="${t}" data-c="${c}">${rot}${on ? (k.startsWith('-') ? ' ↑' : ' ↓') : ''}</th>`; }
function ordena(lista, t, colunas, padrao) {
  const k = S.ui['sort' + t] || String(padrao), asc = k.startsWith('-'), f = colunas[+k.replace('-', '')];
  return lista.sort((a, b) => { const x = f(a), y = f(b);
    if (typeof x === 'string') return (asc ? 1 : -1) * String(y).localeCompare(String(x), 'pt-BR');
    const fx = Number.isFinite(x), fy = Number.isFinite(y); if (fx !== fy) return fx ? -1 : 1; if (!fx) return 0;   // sem valor vai para o fim
    return asc ? x - y : y - x; });
}
const notaCorteRd = () => { const c = cR(), f = FR && fonte(FR);   // fonte atrasada: a página para no último mês que ela tem
  return FR && c < S.corte ? `<p class="note">${esc(f ? f.nome : 'A base desta página')} tem dado só até ${mes(c)}/26: nesta página o acumulado e a tendência vão até ${mes(c)}/26.</p>` : ''; };
const buscaRede = (id, valor, ph) => `<input class="find" id="${id}" type="search" placeholder="${ph}" value="${esc(valor || '')}" aria-label="${ph}">`;

/* ----- Redes Scanntech ----- */
function scanLinhas() {
  const uf = nomesSel('uf'), mk = marcasScan(), rc = nomesSel('recorte');
  if (rc && !rc.has('ÁREA 7')) return [];   // a Scanntech desta base é só a Área 7 (sem PA)
  if (mk && RD.scanm) {   // modo marca: Reckitt = marcas escolhidas; mercado = categorias em que elas vendem (top SKUs da rede)
    return Object.entries(RD.scanm).map(([k, L]) => { const [rede, u] = k.split('|'); if (uf && !uf.has(u)) return null;
      const minhas0 = L.filter(l => mk.has(l[1])); if (!minhas0.length) return null;
      // mercado da marca = só as categorias em que ela pesa (5% ou mais da categoria); evita, por exemplo, Desinfetante inteiro no mercado da Veja
      const tot = l => l[3].reduce((a, v) => a + (v || 0), 0), cats = new Set();
      [...new Set(minhas0.map(l => l[0]))].forEach(c => { const m = minhas0.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0), t = L.filter(l => l[0] === c).reduce((a, l) => a + tot(l), 0); if (t > 0 && m / t >= 0.05) cats.add(c); });
      const minhas = minhas0.filter(l => cats.has(l[0])); if (!minhas.length) return null;
      const so = (RD.scan.find(z => z.rede === rede && z.uf === u) || {}).so;
      return {rede, uf: u, so: !!so, rk: somaArr(minhas.map(l => ({v: l[3]})), 'v'), mk: somaArr(L.filter(l => cats.has(l[0])).map(l => ({v: l[3]})), 'v')}; }).filter(Boolean);
  }
  return RD.scan.filter(s => !uf || uf.has(s.uf));
}
/* ----- market share por UF no título das Redes Scanntech: share oficial por UF (Scanntech Painel 2.0), um mini gráfico por UF e o consolidado da Área 7 ----- */
const SU_ORDEM = ['A7', 'DF', 'GO', 'MT', 'MS', 'TO'];
const shareUF = () => { const Q = RD && RD.share_uf; return Q && Q.ufs && Array.isArray(Q.meses) && Q.ufs.A7 ? Q : null; };   // arquivo de dados antigo, sem o campo: o bloco não aparece
const suNum = x => (typeof x === 'number' && isFinite(x) ? x : NaN);
const suVal = (Q, u, ano, m) => { const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`); return i >= 0 && Array.isArray(u.sh) ? suNum(u.sh[i]) : NaN; };
const suPct = x => (isFinite(x) ? nf1.format(x) + '%' : 'sem dado');
const suPP = d => (isFinite(d) ? `${d >= 0.05 ? '+' : ''}${nf1.format(Math.abs(d) < 0.05 ? 0 : d)} pp` : '');
const suCls = d => (!isFinite(d) ? 'flat' : d >= 0.3 - 1e-9 ? 'up' : d <= -0.3 + 1e-9 ? 'down' : 'flat');   // semáforo: estável quando a variação fica abaixo de 0,3 pp
const suRot = am => `${mes(+am.slice(4))}/${am.slice(2, 4)}`;
const suUm = x => Math.round(x * 10) / 10;   // 1 casa, como na tela
function suAcum(Q, u, ano, ate) {   // acumulado jan a 'ate' = Reckitt (share x mercado) somada sobre o mercado somado, mês a mês (a mesma conta do arquivo de dados)
  let r = 0, t = 0;
  for (let m = 1; m <= ate; m++) {
    const i = Q.meses.indexOf(`${ano}${String(m).padStart(2, '0')}`), s = i >= 0 ? suNum(u.sh[i]) : NaN, k = i >= 0 && Array.isArray(u.mk) ? suNum(u.mk[i]) : NaN;
    if (isFinite(s) && k > 0) { r += s / 100 * k; t += k; }
  }
  return t > 0 ? r / t * 100 : NaN;
}
function suPeriodo(Q) {   // período do card: o mês de corte do site, limitado ao que o painel tem; no último mês fechado, vale o YTD do próprio painel
  const ya = String(Q.ytd_ate || ''), ano = +Q.ano || +ya.slice(0, 4), mY = +ya.slice(4) || 9, pa = String(Q.parcial || ''), mP = pa.slice(0, 4) === String(ano) ? +pa.slice(4) : 0;
  const segue = ano === 2026, c = segue ? Math.max(1, Math.min(S.corte, Math.max(mY, mP))) : mY;   // o mês de corte do site é de 2026
  return {ano, ant: ano - 1, mY, mP, pa, c, cP: c === mP, fim: c === mY && mP === mY + 1 ? mP : c, segue};   // fim = até onde vai a curva do ano: o corte e, no último mês fechado, também o parcial
}
function suVals(Q, P, u) {   // acumulado do ano e do anterior e a variação (diferença dos shares já arredondados, a conta fecha na tela)
  if (P.c === P.mY) return {y6: suNum(u.ytd26), y5: suNum(u.ytd25), d: suNum(u.d)};
  const y6 = suAcum(Q, u, P.ano, P.c), y5 = suAcum(Q, u, P.ant, P.c);
  return {y6, y5, d: isFinite(y6) && isFinite(y5) ? suUm(suUm(y6) - suUm(y5)) : NaN};
}
function suMini(Q, k, W, P) {   // ano anterior cinza, ano atual rosa; eixo vertical justo nos dados da UF; o mês parcial em ponto vazado, ligado por tracejado
  const u = Q.ufs[k], H = 92, pl = 28, pr = 8, pt = 8, pb = 18, gw = (W - pl - pr) / 11;
  const ehP = m => P.mP > 0 && m === P.mP, v6 = m => (m <= P.fim ? suVal(Q, u, P.ano, m) : NaN);
  const s25 = [], s26 = [];
  for (let m = 1; m <= 12; m++) { const a = suVal(Q, u, P.ant, m), b = v6(m); if (isFinite(a)) s25.push([m, a]); if (isFinite(b)) s26.push([m, b]); }
  const xs = [...s25, ...s26].map(p => p[1]); if (!xs.length) return '';
  const lo = Math.min(...xs), hi = Math.max(...xs), folga = Math.max(0.4, (hi - lo) * 0.12), y0 = Math.floor(lo - folga), y1 = Math.ceil(hi + folga);
  const px = m => (pl + (m - 1) * gw).toFixed(1), py = x => (pt + (y1 - x) / (y1 - y0) * (H - pt - pb)).toFixed(1);
  const lin = (L, cor, w) => (L.length > 1 ? `<polyline points="${L.map(([m, x]) => px(m) + ',' + py(x)).join(' ')}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>` : '');
  const fech = s26.filter(([m]) => !ehP(m)), ult = fech[fech.length - 1], par = s26.find(([m]) => ehP(m));
  let s = `<svg class="su-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(`Share ${u.nome} ${P.ant} e ${P.ano} por mês`)}">` +
    `<line x1="${pl}" x2="${W - pr}" y1="${py(y0)}" y2="${py(y0)}" stroke="#ECECEF" stroke-width="1"/>` +
    `<text x="${pl - 6}" y="${(+py(y1) + 3).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#86868B">${y1}%</text><text x="${pl - 6}" y="${(+py(y0) + 1).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#86868B">${y0}%</text>`;
  for (let m = 1; m <= 12; m++) s += `<text x="${px(m)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#86868B">${MESES[m - 1][0]}</text>`;
  s += lin(s25, '#D2D2D7', 2) + lin(fech, '#FF007F', 3);
  if (ult && par) s += `<line x1="${px(ult[0])}" y1="${py(ult[1])}" x2="${px(par[0])}" y2="${py(par[1])}" stroke="#FF007F" stroke-width="1.6" stroke-dasharray="2 3" stroke-linecap="round"/>`;
  if (ult) s += `<circle cx="${px(ult[0])}" cy="${py(ult[1])}" r="3.2" fill="#FF007F"/>`;
  if (par) s += `<circle cx="${px(par[0])}" cy="${py(par[1])}" r="3.4" fill="#FFFFFF" stroke="#FF007F" stroke-width="1.8"/>`;
  for (let m = 1; m <= 12; m++) {   // dica do mês
    const a = suVal(Q, u, P.ant, m), b = v6(m); if (!isFinite(a) && !isFinite(b)) continue;
    const t = `<b>${esc(u.nome)} · ${MESES[m - 1]}${ehP(m) ? '*' : ''}</b> · ${P.ant}: ${suPct(a)} · ${P.ano}${ehP(m) ? ` parcial até ${esc(Q.parcial_ate || '')}` : ''}: ${suPct(b)}`;
    s += `<rect x="${(+px(m) - gw / 2).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`;
  }
  return s + '</svg>';
}
function blocoShareUF() {   // um card só: Área 7 primeiro e as 5 UFs; a tabela mês x UF fica escondida na tela e sai no Excel da página
  const Q = shareUF(); if (!Q) return '';
  const P = suPeriodo(Q), ks = SU_ORDEM.filter(k => Q.ufs[k] && Array.isArray(Q.ufs[k].sh)), U5 = ks.filter(k => k !== 'A7');
  const cols = SLIDE ? 6 : innerWidth <= 640 ? 2 : innerWidth <= 900 ? 3 : 6, gap = SLIDE || innerWidth > 640 ? 18 : 14;
  const W = Math.max(120, Math.floor((larguraCard() - gap * (cols - 1)) / cols));
  const aa = String(P.ano).slice(2), a5 = String(P.ant).slice(2), rotC = mes(P.c) + (P.cP ? '*' : '');
  const V = Object.fromEntries(ks.map(k => [k, suVals(Q, P, Q.ufs[k])]));
  const fUF = nomesSel('uf'), dest = fUF ? U5.filter(k => fUF.has(k)) : [];   // filtro de UF: a UF escolhida em destaque, as outras esmaecidas
  const iC = Q.meses.indexOf(`${P.ano}${String(P.c).padStart(2, '0')}`), iP = P.mP && P.fim === P.mP && !P.cP ? Q.meses.indexOf(P.pa) : -1;
  const mini = k => {
    const u = Q.ufs[k], {y6, y5, d} = V[k], c = suCls(d), vC = iC >= 0 ? suNum(u.sh[iC]) : NaN, vP = iP >= 0 ? suNum(u.sh[iP]) : NaN;
    return `<div class="su-mini${k === 'A7' ? ' a7' : ''}${dest.length && !dest.includes(k) ? ' su-off' : ''}"><div class="su-uf"><b>${k === 'A7' ? 'Área 7' : k}</b><span>${k === 'A7' ? `${U5.length} UFs` : esc(u.nome)}</span></div>
      <div class="su-val">${suPct(y6)}</div>
      <div class="su-dl"><span class="su-d ${c}">${c === 'up' ? '▲' : c === 'down' ? '▼' : '●'} ${suPP(d)}</span><span>${P.ant}: ${suPct(y5)}</span></div>
      ${suMini(Q, k, W, P)}<div class="su-ult">${isFinite(vC) ? `<span>${mes(P.c)}/${aa}${P.cP ? '*' : ''} <b>${suPct(vC)}</b></span>` : ''}${isFinite(vP) ? `<span>${suRot(P.pa)}* ${suPct(vP)}</span>` : ''}</div></div>`;
  };
  const nq = U5.filter(k => suCls(V[k].d) === 'down').length, ng = U5.filter(k => suCls(V[k].d) === 'up').length, n = U5.length;
  const manchete = nq ? (nq === n ? `Share cai nas ${n} UFs.` : `Share cai em ${nq} de ${n} UFs.`) : ng ? (ng === n ? `Share sobe nas ${n} UFs.` : `Share sobe em ${ng} de ${n} UFs.`) : `Share estável nas ${n} UFs.`;
  const temP = P.mP > 0 && P.fim >= P.mP, txP = temP ? `${suRot(P.pa)}* parcial até ${Q.parcial_ate || ''}` : '';
  const filtro = FILTROS.some(([k]) => S.f[k].size);
  const notas = ['Share oficial de cada UF, com todas as lojas da Scanntech no estado. O share das redes, nos números abaixo, conta só as redes do Resumo por Rede Mensal que liberam o mercado e por isso dá outro número.',
    temP ? (P.cP ? `* ${suRot(P.pa)} parcial até ${Q.parcial_ate}, dentro do acumulado: compara um mês ainda incompleto com o mês cheio de ${P.ant}.` : `* ${suRot(P.pa)} parcial até ${Q.parcial_ate}, fora do acumulado (ponto vazado na curva).`) : '',
    filtro ? `Reckitt inteira nas ${n} UFs: o share por UF não abre por marca nem segue os filtros do site${dest.length ? '; a UF filtrada fica em destaque' : ''}.` : '',
    !P.segue && S.corte !== P.mY ? `O share por UF fica em jan a ${mes(P.mY)}/${aa}: não segue o mês de corte do site.` : ''].filter(Boolean).join(' ');
  const celula = x => (isFinite(x) ? nf1.format(x) + '%' : '');
  const tot = (rot, f) => `<tr class="tot"><td class="l">${rot}</td>${ks.map(k => `<td>${f(V[k])}</td>`).join('')}</tr>`;
  const notaXls = `Redes Scanntech · Share por UF · Scanntech Painel 2.0, Reckitt inteira por UF (não abre por marca nem segue os filtros do site) · acumulado jan a ${rotC}/${aa} contra jan a ${mes(P.c)}/${a5}${txP ? ' · ' + txP : ''}`;
  const tabela = `<p class="eyebrow su-xls">Share por UF</p><div class="tw su-xls" data-xls-nota="${esc(notaXls)}"><table><thead><tr><th class="l">Mês</th>${ks.map(k => `<th>${k === 'A7' ? 'Área 7' : k}</th>`).join('')}</tr></thead><tbody>` +
    Q.meses.map((am, i) => `<tr><td class="l">${suRot(am)}${am === P.pa ? '*' : ''}</td>${ks.map(k => `<td>${celula(suNum(Q.ufs[k].sh[i]))}</td>`).join('')}</tr>`).join('') +
    tot(`Acumulado jan a ${mes(P.c)}/${a5}`, x => celula(x.y5)) + tot(`Acumulado jan a ${rotC}/${aa}`, x => celula(x.y6)) + tot(`Variação ${aa} contra ${a5}`, x => suPP(x.d)) + '</tbody></table></div>';
  return `<div class="card shareuf"><div class="su-top"><div><p class="eyebrow">Market share por UF</p><h3>${manchete} <span>Acumulado de jan a ${rotC} de ${P.ano} contra o mesmo período de ${P.ant}.</span></h3></div>
    <div class="legend su-leg"><span><i class="su-ln" style="background:#D2D2D7"></i>${P.ant}</span><span><i class="su-ln su-26" style="background:#FF007F"></i>${P.ano}</span></div></div>
    <div class="su-grid">${ks.map(mini).join('')}</div>${notas ? `<p class="su-nota">${esc(notas)}</p>` : ''}<p class="su-fonte">${esc(String(Q.fonte || 'Scanntech Painel 2.0').replace(/YTD jan-[a-zç]+\*?$/, `YTD jan-${rotC}`))}</p>${tabela}</div>`;   // o período da fonte segue o do card
}
function pgRedesScan() {
  if (!RD) return hero('Redes Scanntech', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
  return emFonte(marcasScan() && RD.scanm ? 'scanntech_marcas' : 'scanntech', pgRedesScanFonte);
}
function pgRedesScanFonte() {
  const L = scanLinhas(), mer = L.filter(s => !s.so);
  // mesmas redes e mesmos meses: só os meses até o corte em que a rede vendeu nos dois anos
  let rk26 = 0, rk25 = 0, mk26 = 0, mk25 = 0;
  mer.forEach(s => { const [a, b] = parR(s.rk, s.mk), [c, d] = parR(s.mk); rk26 += a; rk25 += b; mk26 += c; mk25 += d; });
  const sh26 = rk26 / mk26, sh25 = rk25 / mk25;
  const tudo26 = L.reduce((a, s) => a + ytdR(s.rk, 2026), 0);
  const itens = L.map(s => {
    const r26 = ytdR(s.rk, 2026), r25 = ytdR(s.rk, 2025), m26 = ytdR(s.mk, 2026), [t3, t0] = triR(s.rk);
    const [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
    const [k3] = triR(s.mk), foraPainel = !(m26 > 0), saiu3 = !(k3 > 0);
    let vr = varR(p26, p25), motivo = null;
    if (foraPainel && r25 >= 1000) { vr = NaN; motivo = ['Sem leitura da Scanntech em 2026 (saiu do painel)', 'flat']; }
    else if (r25 >= 1000 && !(r26 > 0)) vr = -1;
    else if (!isFinite(vr) && r25 >= 1000) motivo = p25 >= 1000 && p26 / p25 > 10 ? ['Variação acima de 10x', 'flat'] : ['Sem meses comparáveis entre 25 e 26', 'flat'];
    const vm = !s.so ? varR(q26, q25) : NaN;
    return {s, r26, r25, vr, vm, motivo, sh: s.so || !(m26 > 0) ? NaN : r26 / m26, dsh: s.so || !(q25 > 0) || !(q26 > 0) ? NaN : (p26 / q26 - p25 / q25) * 100, tr: saiu3 ? NaN : varQ(t3, t0), v: vr, col: CRUZ[s.rede + '|' + s.uf]};
  }).filter(x => x.r26 > 0 || x.r25 > 0);
  const sel = S.ui.scsel ? itens.find(x => x.s.rede + '|' + x.s.uf === S.ui.scsel) : null;
  let h = hero('Redes Scanntech', 'Redes de varejo.', 'Venda das lojas, mercado da rede e share da Reckitt. Clique numa rede para abrir.', blocoShareUF()) + recorteTxt() + notaCorteRd();
  if (nomesSel('recorte') && !nomesSel('recorte').has('ÁREA 7')) h += '<p class="note">A Scanntech desta base cobre só a Área 7 (DF, GO, MT, MS e TO): não há redes do JC PA.</p>';
  else if (nomesSel('uf') && ![...nomesSel('uf')].some(u => ['DF', 'GO', 'MT', 'MS', 'TO'].includes(u))) h += '<p class="note">A Scanntech desta base cobre só DF, GO, MT, MS e TO: não há redes do PA.</p>';
  const semAbertura = S.f.marca.size && RD.scanm ? [...S.f.marca].map(i => dic.marca[i]).filter(m => !Object.values(RD.scanm).some(L => L.some(l => l[1] === m))) : [];
  if (semAbertura.length) h += `<p class="note">${semAbertura.map(tit).join(', ')} não aparece na abertura por marca da Scanntech (as categorias de H&N não estão nesta consulta)${semAbertura.length < S.f.marca.size ? ' e ficou de fora da conta' : '. Desmarque a marca para ver a Reckitt inteira'}.</p>`;
  if (!L.length) return h + `<div class="card empty">Nada neste recorte.</div>`;
  if (S.f.marca.size && RD.scanm) h += `<p class="note">Recorte por marca (${[...S.f.marca].map(i => tit(dic.marca[i])).join(', ')}): abertura das ${Object.keys(RD.scanm).length} maiores redes. Mercado = categorias em que a marca pesa 5% ou mais, pelos SKUs mais vendidos de cada rede. O Vanish pó não vem nesta consulta. Como a lista de SKUs é a dos mais vendidos hoje, as variações por marca tendem a sair alguns pontos acima das do Resumo Mensal.</p>`;
  else if (S.f.marca.size) h += '<p class="note">A abertura por marca da Scanntech ainda não está na base: os números são da Reckitt inteira.</p>';
  if (S.f.segmento.size) h += '<p class="note">O segmento não abre nas redes da Scanntech: os números são da marca inteira.</p>';
  if (['executivo', 'grp', 'canal', 'fonte', 'janela'].some(k => S.f[k].size)) h += '<p class="note">Executivo, distribuidor, canal, fonte e comparabilidade não se aplicam à Scanntech (venda das lojas). Aqui vale só a UF; para ver por executivo, use Redes Colecta.</p>';
  h += `<div class="grid g4">
    <div class="card kpi"><div class="lab">Reckitt nas redes ${corteTxt()}</div><div class="val">${mi(mer.reduce((a, s) => a + ytdR(s.rk, 2026), 0))}</div><div class="sub dv">${vbig(varr(rk26, rk25))}<span>mesmas redes e meses: ${mi(rk26)} contra ${mi(rk25)}</span></div></div>
    <div class="card kpi"><div class="lab">Mercado das redes</div><div class="val">${mi(mer.reduce((a, s) => a + ytdR(s.mk, 2026), 0))}</div><div class="sub dv">${vbig(varr(mk26, mk25))}<span>mesmas redes e meses, nossas categorias</span></div></div>
    <div class="card kpi"><div class="lab">Share da Reckitt nas redes</div><div class="val">${p1(sh26)}</div><div class="sub dv">${vpp(sh26 - sh25)}<span>${p1(sh25)} em 2025</span></div></div>
    <div class="card kpi"><div class="lab">Redes com venda</div><div class="val">${n0(itens.length)}</div><div class="sub">${mi(tudo26)} de Reckitt em 2026, incluindo as que só liberam a Reckitt</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Reckitt ${corteTxt()} 2026 contra 2025, por rede e UF.</span></h2>` + termometro(itens);
  if (sel) h += detalheScan(sel);
  RD_ULT = {tipo: 'sc', itens, fr: FR};
  h += `<h2 class="sec">Todas as redes. <span>Ordene pelo cabeçalho; busque pelo nome.</span></h2><div class="card"><div class="pills">${buscaRede('scbusca', S.ui.scbusca, 'Buscar rede')}</div><div id="rd-tab">${tabelaScan(itens)}</div></div>`;
  return h;
}
function tabelaScan(itens) {
  const busca = semAcento(S.ui.scbusca || '');
  let lista = itens.filter(x => !busca || semAcento(x.s.rede).includes(busca));
  lista = ordena(lista, 'sc', [x => x.s.rede, x => x.s.uf, x => x.r25, x => x.r26, x => x.vr, x => x.vm, x => x.sh, x => x.dsh, x => x.tr], 3);
  const mostra = S.ui.sctodas ? lista : lista.slice(0, 60);
  return `<div class="tw"><table><thead><tr>${thSort('sc', 0, 'Rede', 'l')}${thSort('sc', 1, 'UF', 'l')}${thSort('sc', 2, 'Reckitt 25')}${thSort('sc', 3, 'Reckitt 26')}${thSort('sc', 4, 'Reckitt var.')}${thSort('sc', 5, 'Mercado var.')}${thSort('sc', 6, 'Share 26')}${thSort('sc', 7, 'Δ share')}${thSort('sc', 8, 'Últ. 3m vs 3 ant.' + marcaParc(cR()))}<th class="l">Leitura</th><th class="l">No Colecta</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="11" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => `<tr class="clk" data-act="ui" data-k="scsel" data-v="${esc(x.s.rede + '|' + x.s.uf)}"><td class="l b">${tit(x.s.rede)}</td><td class="l">${x.s.uf}</td><td>${n0(x.r25)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}</td><td>${vc(x.vm)}</td><td>${p1(x.sh)}</td><td>${isFinite(x.dsh) ? `<span class="vr ${cls(x.dsh / 100) || 'flat'}">${x.dsh > 0 ? '+' : ''}${nf1.format(x.dsh)} pp</span>` : ''}</td><td>${vc(x.tr)}</td><td class="l">${selo(leituraRede(x.vr, x.vm, x.s.so, x.motivo))}</td><td class="l">${x.col ? '<span class="tag">✓ cruzada</span>' : ''}</td></tr>`).join('') +
    `</tbody></table></div>${!S.ui.sctodas && lista.length > 60 ? `<div class="pager"><button data-act="ui" data-k="sctodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Reckitt R$ = mercado da rede × share da Reckitt (Scanntech, Resumo por Rede Mensal). A variação compara só os meses em que a rede vendeu nos dois anos (mesmas redes e mesmos meses); "Parou de vender" = tinha venda em 2025 e zerou em 2026. Redes que só liberam a venda da Reckitt ficam fora do mercado e do share.</p>`;
}
function detalheScan(x) {
  const s = x.s, a = serie48(s.rk);
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${s.uf} · Scanntech</p><h3>${tit(s.rede)}. <span>${x.motivo ? x.motivo[0] + '.' : !(x.r26 > 0) ? 'Sem venda da Reckitt em 2026.' : s.so ? 'Só libera a venda da Reckitt.' : `Share de ${p1(x.sh)} em 2026.`}</span></h3></div><button class="btn" data-act="ui" data-k="scsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">Reckitt 26 contra 25</span>' : ''}${!s.so && isFinite(x.vm) ? vbig(x.vm) + '<span class="sub">mercado da rede</span>' : ''}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(a, 'rs', 250, null, true, {fv: varR})}<div class="tw"><table><thead><tr><th>Mês</th><th>Mercado 25</th><th>Mercado 26</th><th>Reckitt 25</th><th>Reckitt 26</th><th>Reckitt var.</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= fimSerie();
      const m5 = s.mk[i5], m6 = ok6 ? s.mk[i6] : 0, r5 = s.rk[i5], r6 = ok6 ? s.rk[i6] : 0, s5 = m5 ? r5 / m5 : NaN, s6 = m6 ? r6 / m6 : NaN, d = (s6 - s5) * 100;
      return `<tr><td class="b">${mesRot(m)}</td><td>${n0(m5 || NaN)}</td><td class="b">${n0(m6 || NaN)}</td><td>${n0(r5 || NaN)}</td><td class="b">${n0(r6 || NaN)}</td><td>${vcm(varR(r6, r5), m)}</td><td>${s.so ? '' : p1(s5)}</td><td>${s.so ? '' : p1(s6)}</td><td>${!s.so && isFinite(d) ? `<span class="vr ${cls(d / 100) || 'flat'}">${d > 0 ? '+' : ''}${nf1.format(d)} pp</span>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>';
  h += emFonte('scanntech_marcas', () => marcasScanDet(s.rede + '|' + s.uf));
  h += emFonte(marcasRede() && RD.colm ? 'colecta_marcas' : 'redes_colecta', () => cruzadoColecta(x.col, s.uf));
  return h + '</div>';
}
function marcasScanDet(k) {
  const L = RD.scanm && RD.scanm[k]; if (!L || !L.length) return RD.scanm ? '<p class="note" style="margin-top:16px">Abertura por marca disponível só nas maiores redes (Reckitt acima de R$ 100 mil em 2026).</p>' : '';
  const cats = [...new Set(L.map(l => l[0]))].map(c => { const Lc = L.filter(l => l[0] === c), t26 = Lc.reduce((a, l) => a + ytdR(l[3], 2026), 0), t25 = Lc.reduce((a, l) => a + ytdR(l[3], 2025), 0);
    return {c, Lc, t26, t25, rk: Lc.filter(l => l[2]).reduce((a, l) => a + ytdR(l[3], 2026), 0)}; }).filter(x => x.rk > 0).sort((a, b) => b.rk - a.rk);
  if (!cats.length) return '';
  const cob = RD.scancob && RD.scancob[k];
  return `<div class="cruz"><p class="eyebrow">Marcas e concorrentes na rede · Scanntech</p><h3>Onde a Reckitt ganha e onde perde espaço. <span>Share dentro de cada categoria, ${corteTxt()} 2026 contra 2025.</span></h3>` +
    (cob ? `<p class="note">A abertura por marca cobre ${p1(Math.min(cob, 1))} da Reckitt desta rede no Resumo Mensal${cob < 0.9 ? ' (falta principalmente o Vanish pó, que não vem nesta consulta)' : ''}.</p>` : '') +
    cats.map(x => `<p class="eyebrow" style="margin-top:18px;color:var(--slate)">${esc(x.c)}</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.${marcaParc(cR())}</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
      x.Lc.map(l => ({l, a: ytdR(l[3], 2025), b: ytdR(l[3], 2026)})).sort((p, q) => (q.l[2] - p.l[2]) || (q.b - p.b)).map(({l, a, b}) => { const s5 = x.t25 ? a / x.t25 : NaN, s6 = x.t26 ? b / x.t26 : NaN, d = (s6 - s5) * 100;
        return `<tr><td class="l ${l[2] ? 'b ' + mkCls(l[1]) : ''}">${l[1] === 'OUTRAS' ? 'Outras marcas' : tit(l[1])}${l[2] ? ' <span class="mini">Reckitt</span>' : ''}</td><td>${n0(a || NaN)}</td><td class="${l[2] ? 'b' : ''}">${n0(b || NaN)}</td><td>${vc(varR(b, a))}</td><td>${vc(varR(...triR(l[3])))}</td><td>${p1(s5)}</td><td>${p1(s6)}</td><td>${isFinite(d) ? `<span class="vr ${cls(d / 100) || 'flat'}">${d > 0 ? '+' : ''}${nf1.format(d)} pp</span>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>').join('') +
    '<p class="note" style="margin-top:10px">Fonte: Scanntech, KPIs por SKU da rede (SKUs mais vendidos, Reckitt e concorrentes). O Vanish pó não vem nesta consulta; o total da Reckitt da rede, no alto, inclui tudo.</p></div>';
}
function cruzadoColecta(raizes, uf) {
  if (!raizes || !raizes.length) return '<p class="note" style="margin-top:16px">Esta rede não foi encontrada entre os clientes dos distribuidores no Colecta (pode comprar direto da Reckitt ou de distribuidor fora da base).</p>';
  const mk = marcasRede(), fonte = mk && RD.colm ? RD.colm.filter(c => mk.has(c.marca)) : RD.col;
  const todas = fonte.filter(c => raizes.includes(c.raiz)), L = todas.filter(c => c.uf === uf), tot = somaArr(L, 'rs');
  const outras = ytdR(somaArr(todas.filter(c => c.uf !== uf), 'rs'), 2026);
  const lb = somaArr(L.filter(c => BASE_COMP.has(c.grp)), 'rs'), r26c = ytdR(lb, 2026), r25 = ytdR(lb, 2025), r26 = ytdR(tot, 2026);
  const grps = [...new Set(L.map(c => c.grp))].map(tit).join(', ');
  return `<div class="cruz"><p class="eyebrow">A mesma rede no Colecta · ${uf}${mk ? ' · ' + [...mk].map(m => m === 'HN' ? 'H&N' : tit(m)).join(', ') : ''}</p><h3>${rsx(r26)} comprados dos distribuidores em ${uf} ${corteTxt()}. <span>${raizes.map(nomeRaiz).map(tit).join(' · ')}</span></h3>
    <div class="termo">${r25 >= 1000 ? vbig(varQ(r26c, r25)) + '<span class="sub">26 contra 25 nos distribuidores com 2025 completo</span>' : '<span class="sub">Sem base comparável de 2025 no Colecta (distribuidor entrou depois ou 2025 incompleto)</span>'}${isFinite(varQ(...triCol(L))) ? vbig(varQ(...triCol(L))) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    <p class="note">${grps ? 'Distribuidores: ' + grps + '. ' : 'Sem compra pelos distribuidores nesta UF. '}${outras >= 1000 ? `A mesma empresa compra mais ${rsx(outras)} em outras UFs. ` : ''}Compra do distribuidor (Colecta) e venda ao consumidor (Scanntech) andam em ritmos diferentes: a compra concentra pedidos e a loja vende todo dia.</p>
    ${r26 >= 1000 ? chart(serie48(tot), 'rs', 200, null, true, {semVar: true, pk: FR || 'redes_colecta'}) : ''}</div>`;
}

/* ----- Redes Colecta ----- */
const FORA_A7 = new Set(RD && RD.fora_area7 ? RD.fora_area7 : []);
const recorteGrp = g => (FORA_A7.has(g) ? dic.recorte.find(x => x !== 'ÁREA 7') || 'FORA' : 'ÁREA 7');   // recorte é do distribuidor, como no resto do site
function colLinhas(semMarca) {
  const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte'), mk = semMarca ? null : marcasRede();
  const fonte = mk && RD.colm ? RD.colm.filter(c => mk.has(c.marca)) : RD.col;
  return fonte.filter(c => (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec)) && (!rc || rc.has(recorteGrp(c.grp))));
}
const temBase = c => BASE_COMP.has(c.grp);
function triFora(L) {   // distribuidores do recorte que ficam fora da tendência por não cobrirem as 6 janelas
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`), ini = RD.inicio_tend || RD.dist_inicio; if (fim < 5) return [];
  return [...new Set(L.filter(c => (ini[c.grp] || '9') > RM[fim - 5]).map(c => tit(c.grp)))];
}
function triCol(L) {   // tendência só com distribuidores que já existiam nas 6 janelas
  const fim = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`); if (fim < 5) return [NaN, NaN];
  const ini = RD.inicio_tend || RD.dist_inicio;
  return triR(somaArr(L.filter(c => (ini[c.grp] || '9') <= RM[fim - 5]), 'rs'));
}
const EXEC_GRP = {}; if (RD) RD.col.forEach(c => { EXEC_GRP[c.grp] = c.exec; }); if (RD && RD.colm) RD.colm.forEach(c => { c.exec = EXEC_GRP[c.grp] || ''; });
function pgRedesCol() {
  if (!RD) return hero('Redes Colecta', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
  return emFonte(marcasRede() && RD.colm ? 'colecta_marcas' : 'redes_colecta', pgRedesColFonte);
}
function pgRedesColFonte() {
  const L = colLinhas(), mk = marcasRede(), lojasDe = mk && mk.size > 1 ? colLinhas(true) : null;   // várias marcas: lojas da rede inteira (sem somar marca a marca)
  const por = new Map();
  L.forEach(c => { const x = por.get(c.raiz) || {raiz: c.raiz, linhas: []}; x.linhas.push(c); por.set(c.raiz, x); });
  const itens = [...por.values()].map(x => {
    const rs = somaArr(x.linhas, 'rs'), lj = somaArr(lojasDe ? lojasDe.filter(c => c.raiz === x.raiz) : x.linhas, 'lj'), base = x.linhas.filter(temBase), rb = somaArr(base, 'rs');
    const r26 = ytdR(rs, 2026), b25 = ytdR(rb, 2025), b26 = ytdR(rb, 2026), [t3, t0] = triCol(x.linhas);
    const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
    return {raiz: x.raiz, linhas: x.linhas, rs, lj, r26, b26, b25, vr: varQ(b26, b25), parcial: base.length < x.linhas.length, tr: varQ(t3, t0), v: varQ(t3, t0),
      lojas: lj[ult] || 0, ufs: [...new Set(x.linhas.map(c => c.uf))].join(', '), grps: [...new Set(x.linhas.map(c => c.grp))], sc: CRUZ['r:' + x.raiz]};
  }).filter(x => x.r26 > 0 || x.b25 > 0);
  const tot = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs'), r26 = ytdR(tot, 2026), b26 = ytdR(base, 2026), b25 = ytdR(base, 2025);
  const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`), lojasUlt = somaArr(lojasDe || L, 'lj')[ult] || 0;
  const chU = (() => { if (mk || S.f.recorte.size) return null; const ex = nomesSel('executivo'), uf = nomesSel('uf'), gr = nomesSel('grp'); const p = [];
    if (ex) { if (ex.size > 1) return null; p.push('exec:' + [...ex][0]); } if (gr) { if (gr.size > 1 || ex) return null; p.push('grp:' + [...gr][0]); } if (uf) { if (uf.size > 1) return null; p.push('uf:' + [...uf][0]); } return p.join('|'); })();
  const unicosUlt = chU !== null && RD.unicos && RD.unicos[chU] ? RD.unicos[chU][ult] || 0 : null;
  const nomeadas = itens.filter(x => x.raiz !== 'DEMAIS' && x.raiz !== 'PF').sort((a, b) => b.r26 - a.r26);
  const top20 = nomeadas.slice(0, 20).reduce((a, x) => a + x.r26, 0);
  const sel = S.ui.clsel ? itens.find(x => x.raiz === S.ui.clsel) : null;
  let h = hero('Redes Colecta', 'Redes compradoras.', 'Clientes dos distribuidores agrupados por rede (raiz do CNPJ). Filtre executivo, UF e distribuidor no topo.') + recorteTxt() + notaCorteRd();
  if (S.f.marca.size && !RD.colm) h += '<p class="note">A abertura por marca das redes do Colecta ainda não está na base: os números são de todas as marcas.</p>';
  else if (S.f.marca.size) h += `<p class="note">Recorte por marca: ${[...S.f.marca].map(i => tit(dic.marca[i])).join(', ')}.${temHN() ? ' Sustagen, Jontex, Olla e Veet aparecem juntos como H&N nas redes.' : ''}</p>`;
  if (S.f.segmento.size) h += '<p class="note">O segmento não abre nas redes: os números são da marca inteira.</p>';
  if (['canal', 'fonte', 'janela'].some(k => S.f[k].size)) h += '<p class="note">Canal, fonte e comparabilidade não se aplicam às redes do Colecta: os números são de todos os canais. Aqui valem UF da loja, distribuidor, executivo, recorte e marca.</p>';
  if (S.f.uf.size) h += '<p class="note">A UF aqui é a da loja (cadastro do CNPJ), não a do distribuidor. Lojas de UFs fora da lista do filtro (BA e MA) só aparecem sem filtro de UF.</p>';
  h += `<div class="grid g4">
    <div class="card kpi"><div class="lab">Compra das redes ${corteTxt()}</div><div class="val">${mi(r26)}</div><div class="sub dv">${b25 >= 1000 ? vbig(varr(b26, b25)) + `<span>26 contra 25 na base comparável (${[...new Set(L.filter(temBase).map(c => tit(c.grp)))].join(', ')})</span>` : '<span>sem base comparável de 2025 neste recorte</span>'}</div></div>
    <div class="card kpi"><div class="lab">Tendência${marcaParc(cR())}</div><div class="val ${cls(varR(...triCol(L)))}">${isFinite(varR(...triCol(L))) ? pc(varR(...triCol(L))) : '·'}</div><div class="sub">${isFinite(varR(...triCol(L))) ? 'últimos 3 meses contra os 3 anteriores' + (triFora(L).length ? ' (sem ' + triFora(L).join(', ') + ', que não cobre as 6 janelas)' : '') : 'sem as 6 janelas de comparação: o distribuidor entrou depois'}</div></div>
    <div class="card kpi"><div class="lab">Lojas compradoras em ${mes(cR())}${marcaParc(cR())}</div><div class="val">${n0(unicosUlt !== null ? unicosUlt : lojasUlt)}</div><div class="sub">${unicosUlt !== null ? `CNPJs únicos; soma por distribuidor ${n0(lojasUlt)} (sobreposição ${p1(1 - unicosUlt / lojasUlt)})` : `CNPJs, soma por distribuidor${lojasDe ? ' (todas as marcas)' : ''}`}; ${n0(nomeadas.length)} redes nomeadas</div></div>
    <div class="card kpi"><div class="lab">Concentração</div><div class="val">${p1(top20 / r26)}</div><div class="sub">do R$ nas 20 maiores redes</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Tendência dos últimos 3 meses contra os 3 anteriores, por rede.</span></h2>` + termometro(nomeadas);
  if (sel) h += detalheCol(sel);
  RD_ULT = {tipo: 'cl', itens, fr: FR};
  if (!L.length) h += '<p class="note">Nenhuma rede neste recorte: o executivo ou o distribuidor escolhido não tem distribuidor no Colecta.</p>';
  h += `<h2 class="sec">Todas as redes. <span>Ordene pelo cabeçalho; busque por nome ou cidade.</span></h2><div class="card"><div class="pills">${buscaRede('clbusca', S.ui.clbusca, 'Buscar rede ou cidade')}</div><div id="rd-tab">${tabelaCol(itens)}</div></div>`;
  return h;
}
function tabelaCol(itens) {
  const busca = semAcento(S.ui.clbusca || '');
  let lista = itens.filter(x => !busca || semAcento(nomeRaiz(x.raiz) + ' ' + ((RD.nomes[x.raiz] || {}).razao || '') + ' ' + ((RD.nomes[x.raiz] || {}).municipio || '')).includes(busca));
  lista = ordena(lista, 'cl', [x => nomeRaiz(x.raiz), x => x.ufs, x => x.b25, x => x.r26, x => x.vr, x => x.tr, x => x.lojas], 3);
  lista = [...lista.filter(x => x.raiz !== 'DEMAIS' && x.raiz !== 'PF'), ...lista.filter(x => x.raiz === 'DEMAIS' || x.raiz === 'PF')];
  const mostra = S.ui.cltodas ? lista : lista.slice(0, 80);
  return `<div class="tw"><table><thead><tr>${thSort('cl', 0, 'Rede', 'l')}${thSort('cl', 1, 'UF', 'l')}<th class="l">Distribuidor</th>${thSort('cl', 2, 'R$ 25 (base)')}${thSort('cl', 3, 'R$ 26')}${thSort('cl', 4, '26 vs 25')}${thSort('cl', 5, 'Últ. 3m vs 3 ant.' + marcaParc(cR()))}${thSort('cl', 6, `Lojas ${mes(cR())}${marcaParc(cR())}`)}<th class="l">Na Scanntech</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="9" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => { const n = RD.nomes[x.raiz] || {}; return `<tr class="clk" data-act="ui" data-k="clsel" data-v="${x.raiz}"><td class="l b">${tit(nomeRaiz(x.raiz))}${n.municipio ? `<div class="mini">${esc(n.municipio)}</div>` : ''}</td><td class="l">${x.ufs}</td><td class="l">${x.grps.map(tit).join(', ')}</td><td>${n0(x.b25 || NaN)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}${x.parcial && isFinite(x.vr) ? '<span class="mini"> base parcial</span>' : ''}</td><td>${vc(x.tr)}</td><td>${n0(x.lojas || NaN)}</td><td class="l">${x.sc ? `<span class="tag">✓ ${x.sc.map(k => tit(k.split('|')[0])).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</span>` : ''}</td></tr>`; }).join('') +
    `</tbody></table></div>${!S.ui.cltodas && lista.length > 80 ? `<div class="pager"><button data-act="ui" data-k="cltodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Rede = raiz do CNPJ (8 dígitos); nome pela Receita. As 1.000 maiores redes aparecem nomeadas; o resto está em "Demais clientes". 26 contra 25 só nos distribuidores com 2025 completo no Colecta (${[...BASE_COMP].map(tit).join(', ')}) (acumulado, mês sem compra conta como zero). Os distribuidores que entraram no Colecta depois de jan/25 ou têm 2025 incompleto ficam fora dessa conta: para eles vale a tendência dos últimos 3 meses. Lojas = soma de CNPJs por distribuidor.</p>`;
}
function detalheCol(x) {
  const n = RD.nomes[x.raiz] || {};
  const porG = x.grps.map(g => { const L = x.linhas.filter(c => c.grp === g), rs = somaArr(L, 'rs'); return {g, r26: ytdR(rs, 2026), r25: temBase({grp: g}) ? ytdR(rs, 2025) : NaN, vr: temBase({grp: g}) ? varQ(ytdR(rs, 2026), ytdR(rs, 2025)) : NaN, tr: varQ(...triCol(L))}; }).sort((a, b) => b.r26 - a.r26);
  const rb = somaArr(x.linhas.filter(temBase), 'rs');
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${x.ufs} · Colecta</p><h3>${tit(nomeRaiz(x.raiz))}. <span>${n.razao ? tit(n.razao) : ''}${n.municipio ? ' · ' + esc(n.municipio) + '/' + (n.uf || '') : ''}${x.raiz.length === 8 ? ' · raiz ' + x.raiz : ''}</span></h3></div><button class="btn" data-act="ui" data-k="clsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">26 contra 25 na base comparável</span>' : '<span class="sub">Sem base comparável de 2025 no Colecta</span>'}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(serie48(x.rs), 'rs', 250, null, true, {fv: varR, semVar: x.parcial})}<div class="tw"><table><thead><tr><th>Mês</th><th>R$ 25</th><th>R$ 26</th><th>Var. (base comparável)</th><th>Lojas 25</th><th>Lojas 26</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= fimSerie();
      const a5 = x.rs[i5], a6 = ok6 ? x.rs[i6] : 0; return `<tr><td class="b">${mesRot(m)}</td><td>${n0(a5 || NaN)}</td><td class="b">${n0(a6 || NaN)}</td><td>${vcm(varR(ok6 ? rb[i6] : 0, rb[i5]), m)}</td><td>${n0(x.lj[i5] || NaN)}</td><td class="b">${n0(ok6 ? x.lj[i6] || NaN : NaN)}</td></tr>`; }).join('') + '</tbody></table></div>' +
    `<p class="eyebrow" style="margin-top:22px">Por distribuidor</p><div class="tw"><table><thead><tr><th class="l">Distribuidor</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.</th></tr></thead><tbody>` +
    porG.map(p => `<tr><td class="l b">${tit(p.g)}</td><td>${n0(p.r25)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vr)}</td><td>${vc(p.tr)}</td></tr>`).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">Lojas = soma de CNPJs por distribuidor. 26 contra 25 só nos distribuidores com 2025 completo no Colecta (acumulado; mês sem compra conta como zero).</p>';
  if (RD.colm) h += emFonte('colecta_marcas', () => marcasColDet(x));
  if (x.sc) h += emFonte('scanntech', () => scanCruzDet(x));
  else h += '<p class="note" style="margin-top:16px">Esta rede não foi encontrada na Scanntech (a loja pode não ter leitura de caixa na Scanntech ou ter outro nome de rede).</p>';
  return h + '</div>';
}
function marcasColDet(x) {   // marcas da rede no Colecta (abertura por marca, no corte dela)
  let h = '';
  const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte');
  const Lm = RD.colm.filter(c => c.raiz === x.raiz && (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec || '')) && (!rc || rc.has(recorteGrp(c.grp))));
  const ult = RM.indexOf(`2026${String(cR()).padStart(2, '0')}`);
  const pm = ['VEJA', 'VANISH', 'FINISH', 'HARPIC', 'HN'].map(m => { const L = Lm.filter(c => c.marca === m); if (!L.length) return null; const rs = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs');
    return {m, r26: ytdR(rs, 2026), b25: ytdR(base, 2025), vb: varQ(ytdR(base, 2026), ytdR(base, 2025)), tr: varQ(...triCol(L)), lj: somaArr(L, 'lj')[ult] || 0}; }).filter(Boolean);
  const t26 = pm.reduce((a, p) => a + p.r26, 0);
  if (pm.length) h += `<p class="eyebrow" style="margin-top:22px">Marcas na rede</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25 (base)</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.${marcaParc(cR())}</th><th>Peso 26</th><th>Lojas em ${mes(cR())}${marcaParc(cR())}</th></tr></thead><tbody>` +
    pm.sort((a, b) => b.r26 - a.r26).map(p => `<tr><td class="l b ${mkCls(p.m)}">${p.m === 'HN' ? 'H&N' : tit(p.m)}</td><td>${n0(p.b25 || NaN)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vb)}</td><td>${vc(p.tr)}</td><td>${p1(p.r26 / t26)}</td><td>${n0(p.lj || NaN)}</td></tr>`).join('') + '</tbody></table></div>';
  return h;
}
function scanCruzDet(x) {   // a mesma rede na Scanntech (Resumo Mensal, no corte dele)
  return x.sc.map(k => { const s = RD.scan.find(z => z.rede + '|' + z.uf === k); if (!s) return ''; const r26 = ytdR(s.rk, 2026), m26 = ytdR(s.mk, 2026), [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
    const r25 = p25, m25 = q25;
    return `<div class="cruz"><p class="eyebrow">A mesma rede na Scanntech · ${s.uf}${S.f.marca.size ? ' · Reckitt inteira' : ''}</p><h3>${tit(s.rede)}: ${mi(r26)} de Reckitt vendidos nas lojas ${corteTxt()}. <span>${s.so ? 'Só libera a Reckitt.' : 'Share de ' + p1(r26 / m26) + '.'}</span></h3>
      <div class="termo">${isFinite(varQ(p26, p25)) ? vbig(varQ(p26, p25)) + '<span class="sub">Reckitt nas lojas, 26 contra 25 (mesmos meses)</span>' : ''}${!s.so && isFinite(varR(q26, q25)) ? vbig(varR(q26, q25)) + '<span class="sub">mercado da rede</span>' : ''}</div>${chart(serie48(s.rk), 'rs', 200, null, true, {fv: varR, pk: 'scanntech'})}</div>`; }).join('');
}

function pgDepara() {
  return hero('De-para', 'Distribuidores, fontes e segmentos.', 'Hierarquia do CTO, regra de fonte por período e a régua única entre MTRIX e Colecta.') + tabelaFontes() +
    `<div class="card"><p class="eyebrow">Hierarquia e fonte</p><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th><th class="l">Canal</th><th class="l">Executivo de vendas</th>
    <th class="l">Fonte 2023-2024</th><th class="l">Fonte 2025</th><th class="l">Fonte 2026</th><th class="l">Série emendada</th><th class="l">Mesma régua</th></tr></thead><tbody>` +
    D.depara.map(d => `<tr><td class="l b">${tit(d.grp)}</td><td class="l">${d.uf}</td><td class="l">${tit(d.canal)}</td><td class="l">${esc(d.executivo)}</td><td class="l">${esc(d.f2324)}</td><td class="l">${esc(d.f25)}</td><td class="l">${esc(d.f26)}</td><td class="l">${d.emendada}</td><td class="l">${d.regua}</td></tr>`).join('') +
    `</tbody></table></div></div><div class="card"><p class="eyebrow">Régua de segmentos · MTRIX (Segmento AR) x Colecta (Subcategoria)</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th class="l">Segmento no dash</th><th class="l">MTRIX</th><th class="l">Colecta</th></tr></thead><tbody>` +
    D.regua.map(x => `<tr><td class="l b ${mkCls(x.marca)}">${tit(x.marca)}</td><td class="l">${tit(x.segmento)}</td><td class="l">${esc(x.mtrix)}</td><td class="l">${esc(x.colecta)}</td></tr>`).join('') + '</tbody></table></div></div>';
}

function tabelaFontes() {
  const L = (DSO.atualizacao || {}).fontes || []; if (!L.length) return '';
  const sit = f => ({ok: ['Em dia', 'up'], parc: [`Em dia, ${f.ate_txt} parcial`, 'parc'], warn: [faltaFonte(f), 'warn'], flat: ['Encerrada', 'flat']})[estadoFonte(f)];
  return `<div class="card"><p class="eyebrow">Data de cada fonte</p><div class="tw"><table><thead><tr><th class="l">Fonte</th><th class="l">Extraída em</th><th class="l">Dado até</th><th class="l">Último mês fechado</th><th class="l">Situação</th><th class="l">O que é</th></tr></thead><tbody>` +
    L.map(f => `<tr><td class="l b">${esc(f.nome)}</td><td class="l">${esc(f.extraido ? f.extraido + (f.hora ? ' ' + f.hora : '') : '-')}</td><td class="l">${esc(f.ate_dia + (f.parcial ? ` (${f.ate_txt} parcial)` : ''))}</td><td class="l">${esc(f.fechado_txt || f.ate_txt)}</td><td class="l">${selo(sit(f))}</td><td class="l txt">${esc(f.obs || '')}</td></tr>`).join('') +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">Site publicado em ${esc(DSO.gerado)}. A data de publicação muda a cada republicação do site; a data que vale para o número é a da extração de cada fonte. A régua de em dia compara o último mês fechado: a partir do dia 8, o site precisa ter o mês anterior fechado.</p></div>`;
}
function linhasBase() {
  const nv = MODO === 'si' ? 'SEGMENTO' : (S.ui.bnv || 'TOTAL'), mk = gMarcas(), sg = gSegs();
  return BASE.filter(r => (nv === 'TODOS' || r[COL.nivel] === NIV[nv === 'SEGMENTO' ? 'SEG' : nv]) && (!mk || mk.has(r[COL.marca]) || r[COL.marca] === TODAS) && (!sg || sg.has(r[COL.segmento]) || r[COL.segmento] === TODOS));
}
const CAB = () => (MODO === 'si'
  ? ['AnoMes','Ano','Mês','Cliente (L4)','BU','Cliente','Executivo','Canal','Fonte','Executivo na época','Nível','Marca','Segmento','NR R$','Caixas']
  : ['AnoMes','Ano','Mês','Recorte','UF','Grp. Econômico','Executivo de Vendas','Canal','Fonte','Comparabilidade','Nível','Marca','Segmento','Sell out R$','Caixas','PDVs']);
const celulas = r => [r[0] * 100 + r[1], r[0], MESES[r[1] - 1], ...['recorte','uf','grp','executivo','canal','fonte','janela','nivel','marca','segmento'].map(k => dic[k][r[COL[k]]]), r[RS], r[CX], ...(MODO === 'si' ? [] : [r[PDV]])];
function pgBase() {
  const L = linhasBase().slice().sort((a, b) => b[0] * 100 + b[1] - (a[0] * 100 + a[1])), pg = S.ui.pag || 0, por = 50, np = Math.max(1, Math.ceil(L.length / por));
  const p = Math.min(pg, np - 1); S.ui.pag = p;
  return hero('Base geral', 'A base que alimenta tudo.', `${n0(L.length)} linhas no recorte atual${T('', ' (P&L Restated, meses fechados)')}. As segmentações filtram aqui também.`) +
    `<div class="card"><div class="pills">${MODO === 'si' ? '<span class="note" style="margin:0">P&L Restated no nível segmento. NR e caixas somam direto.</span>' : ['TOTAL','MARCA','SEGMENTO','TODOS'].map(n => `<button data-act="ui" data-k="bnv" data-v="${n}" class="${n === (S.ui.bnv || 'TOTAL') ? 'on' : ''}">Nível ${tit(n)}</button>`).join('')}
    <button class="btn dark" data-act="csv" style="margin-left:auto">${ART ? 'Copiar o recorte para o Excel' : 'Baixar CSV do recorte'}</button></div>
    ${ART ? '<textarea id="csvbox" class="csvbox" hidden readonly aria-label="Recorte em texto para copiar"></textarea>' : ''}
    <div class="tw"><table><thead><tr>${CAB().map((c, i) => `<th class="${i > 2 && i < 13 ? 'l' : ''}">${c}</th>`).join('')}</tr></thead><tbody>` +
    L.slice(p * por, p * por + por).map(r => `<tr>${celulas(r).map((c, i) => `<td class="${i > 2 && i < 13 ? 'l' : ''}">${i >= 13 ? n0(c) : esc(c)}</td>`).join('')}</tr>`).join('') +
    `</tbody></table></div><div class="pager"><button data-act="pag" data-d="-1" ${p === 0 ? 'disabled' : ''}>‹ Anterior</button>Página ${p + 1} de ${np}<button data-act="pag" data-d="1" ${p >= np - 1 ? 'disabled' : ''}>Próxima ›</button></div></div>`;
}
function baixarCSV(btn) {
  const L = linhasBase();
  if (ART) {   // o link do claude.ai não deixa a página baixar arquivo: copia em colunas (tab) para colar no Excel
    const c = s => (typeof s === 'number' ? String(s).replace('.', ',') : String(s).replace(/[\t\n]/g, ' '));
    const txt = [CAB().join('\t'), ...L.map(r => celulas(r).map(c).join('\t'))].join('\n');
    const falha = () => { const ta = document.getElementById('csvbox'); if (!ta) return; ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); btn.textContent = 'Texto selecionado: use Cmd+C ou Ctrl+C'; };
    try { navigator.clipboard.writeText(txt).then(() => { btn.textContent = `Copiado: ${n0(L.length)} linhas. Cole no Excel`; }, falha); } catch (e) { falha(); }
    return;
  }
  const q = s => (typeof s === 'number' ? String(s).replace('.', ',') : '"' + String(s).replace(/"/g, '""') + '"');
  const txt = '﻿' + [CAB().map(q).join(';'), ...L.map(r => celulas(r).map(q).join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'text/csv;charset=utf-8'}));
  a.download = `base_governanca_cto_${T('sellout', 'sellin')}_corte_${S.corte}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ======================= Perna Sell In: clientes, executivos, plano do Q4 e mês em curso ======================= */
const MK_HYG = ['VEJA', 'VANISH', 'HARPIC', 'FINISH'];
const MK_HN_SI = ['JONTEX', 'OLLA', 'SUSTAGEN', 'VEET', 'DERMODEX', 'LUFTAL', 'LUFTAGASTRO', 'LUFTALAX', 'STREPSILS', 'NALDECON', 'NUROMOL', 'LUFTAFEM'];
const idHyg = () => id('uf', 'Hygiene');
const infoGrp = nome => D.depara.find(d => d.grp === nome);
const omMes = () => (D.om ? +D.om.data.slice(4, 6) : NaN);
const omData = () => (D.om ? `${D.om.data.slice(6, 8)}/${D.om.data.slice(4, 6)}` : 'sem Order Management');
const ZERO_OM = {fat: 0, cart: 0, aloc: 0, fut: 0, bloq: 0, nfat: 0, ncart: 0, nfut: 0, nbloq: 0, vfat: 0, vped: 0};
const Q4P = () => D.q4 || {piso: NaN, alvo: NaN, regua_item1: NaN, regua_item2: NaN, rot: {}, txt: {}};   // parâmetros da régua: só no arquivo cifrado
const rq = k => esc((Q4P().rot || {})[k] || ''), tq = k => esc((Q4P().txt || {})[k] || '');
const om1 = o => Object.assign({...ZERO_OM}, omSoma(o).get('_') || {});
const dRS = x => (isFinite(x) ? `<span class="vr ${x > 0.5 ? 'up' : x < -0.5 ? 'down' : 'flat'}">${x > 0 ? '+' : ''}${n0(x)}</span>` : '');
const pctMeta = x => (isFinite(x) ? `<span class="vr ${x >= 1 ? 'up' : x >= Q4P().piso ? 'warn' : 'down'}">${p1(x)}</span>` : '');
const pctMetaG = pctMeta;   // atingimento: verde a partir de 100%, amarelo a partir do piso
const zeroNaN = x => (x ? x : NaN);

/* curva do ano numa linha: 2025 cinza, 2026 rosa e o plano do Q4 tracejado */
function spark(a, pa) {
  const W = 132, H = 34, px = m => 4 + (m - 1) * (W - 8) / 11;
  let mx = 0;
  for (let m = 1; m <= 12; m++) [v(a, 2025, m), v(a, 2026, m), pa ? v(pa, 2026, m) : NaN].forEach(x => { if (x > mx) mx = x; });
  if (!mx) return '';
  const py = x => (H - 3 - Math.max(0, x) / mx * (H - 6)).toFixed(1);
  const linha = (pts, cor, extra = '') => (pts.length > 1 ? `<polyline points="${pts.map(([m, x]) => px(m).toFixed(1) + ',' + py(x)).join(' ')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${extra}/>` : '');
  const p25 = [], p26 = [], pp = [];
  for (let m = 1; m <= 12; m++) { const x = v(a, 2025, m), y = v(a, 2026, m); if (isFinite(x)) p25.push([m, x]); if (isFinite(y) && !ehParcial(m)) p26.push([m, y]); }
  if (pa) {
    Q4M.forEach(m => { const x = v(pa, 2026, m); if (x > 0) pp.push([m, x]); });
    const ult = p26[p26.length - 1]; if (pp.length && ult && ult[0] === pp[0][0] - 1) pp.unshift(ult);
  }
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${linha(p25, '#D2D2D7')}${linha(pp, '#6E6E73', 'stroke-dasharray="3 3"')}${linha(p26, '#FF007F')}</svg>`;
}

/* curvas de crescimento e queda: uma linha por chave (cliente, executivo, marca) */
function curvasDados(chaveFn, opts) {
  const R = cubo('rs', {...opts, chave: chaveFn}), C = cubo('cx', {...opts, chave: chaveFn}), P = cuboP('rs', {...opts, chave: chaveFn});
  const c = S.corte, u3 = [c - 2, c - 1, c].filter(m => m >= 1), a3 = [c - 5, c - 4, c - 3].filter(m => m >= 1);
  const vazio = () => new Float64Array(48).fill(NaN);
  return [...new Set([...R.keys(), ...P.keys()])].map(k => {
    const a = R.get(k) || vazio(), cx = C.get(k) || vazio(), pa = P.get(k) || null;
    const r25 = agg(a, 2025, ate(c), false), r26 = agg(a, 2026, ate(c), false), c25 = agg(cx, 2025, ate(c), false), c26 = agg(cx, 2026, ate(c), false);
    const pl = pa ? agg(pa, 2026, Q4M, false) : NaN, q425 = agg(a, 2025, Q4M, false);
    return {k, a, pa, r25, r26, c25, c26, q425, pl, d: varr(r26, r25), dr: (isFinite(r26) ? r26 : 0) - (isFinite(r25) ? r25 : 0),
      t3: a3.length === 3 && u3.length === 3 ? varr(agg(a, 2026, u3, false), agg(a, 2026, a3, false)) : NaN, t3a: u3.length === 3 ? varr(agg(a, 2026, u3, false), agg(a, 2025, u3, false)) : NaN,
      dc: varr(c26, c25), nc: r26 / c26, dnc: varr(r26 / c26, r25 / c25), dpl: varr(pl, q425)};
  }).filter(x => isFinite(x.r25) || isFinite(x.r26) || x.pl > 0);
}
function tabelaCurvas(t, rotulo, L, nomeFn, extraFn) {
  const cols = [x => semAcento(nomeFn(x.k)), x => x.r25, x => x.r26, x => x.d, x => x.dr, x => x.t3a, x => x.t3, x => x.c26, x => x.dc, x => x.nc, x => x.dnc, x => x.pl, x => x.dpl];
  ordena(L, t, cols, 2);
  const comPl = L.some(x => x.pl > 0), sel = String(S.ui['sel' + t] ?? '');
  const u = S.corte, tri = u >= 3 ? `${mes(u - 2)} a ${mes(u)}${marcaParc(u)}` : 'últimos meses';
  const soma = f => L.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0);
  const T0 = {r25: soma(x => x.r25), r26: soma(x => x.r26), c25: soma(x => x.c25), c26: soma(x => x.c26), pl: soma(x => x.pl), q425: soma(x => x.q425)};
  const linha = (x, tot) => `<tr class="${tot ? 'tot' : String(x.k) === sel ? 'on' : ''}"><td class="l b">${tot ? 'Total' : `<button class="lnk" data-act="ui" data-k="sel${t}" data-v="${String(x.k) === sel ? '' : x.k}">${nomeFn(x.k)}</button>`}</td>` +
    (extraFn ? `<td class="l">${tot ? '' : extraFn(x.k)}</td>` : '') + `<td>${tot ? '' : spark(x.a, x.pa)}</td>` +
    `<td>${n0(x.r25)}</td><td class="b">${n0(x.r26)}</td><td>${vc(varr(x.r26, x.r25))}</td><td>${dRS((x.r26 || 0) - (x.r25 || 0))}</td><td>${tot ? '' : vc(x.t3a)}</td><td>${tot ? '' : vc(x.t3)}</td>` +
    `<td>${n0(x.c26)}</td><td>${vc(varr(x.c26, x.c25))}</td><td>${n2(x.r26 / x.c26)}</td><td>${vc(varr(x.r26 / x.c26, x.r25 / x.c25))}</td>` +
    (comPl ? `<td class="b pl">${n0(zeroNaN(x.pl))}</td><td>${n0(x.q425)}</td><td>${vc(varr(x.pl, x.q425))}</td>` : '') + '</tr>';
  return `<div class="tw"><table><thead><tr>${thSort(t, 0, rotulo, 'l')}${extraFn ? '<th class="l"></th>' : ''}<th>Curva 25 · 26${comPl ? ' · plano' : ''}</th>
    ${thSort(t, 1, `${T('R$', 'NR')} 25 ${corteTxt()}`)}${thSort(t, 2, `${T('R$', 'NR')} 26`)}${thSort(t, 3, '26 vs 25')}${thSort(t, 4, T('Δ R$', 'Δ NR R$'))}${thSort(t, 5, `${tri} vs 25`)}${thSort(t, 6, `${tri} vs 3 ant.`)}
    ${thSort(t, 7, 'Caixas 26')}${thSort(t, 8, 'Var. cx')}${thSort(t, 9, T('R$/cx 26', 'NR/cx 26'))}${thSort(t, 10, T('Var. R$/cx', 'Var. NR/cx'))}
    ${comPl ? `${thSort(t, 11, 'Plano Q4')}<th>Q4 2025</th>${thSort(t, 12, 'Plano vs Q4/25')}` : ''}</tr></thead><tbody>
    ${L.map(x => linha(x)).join('') || '<tr><td colspan="16" class="empty">Nada neste recorte.</td></tr>'}${L.length ? linha(T0, true) : ''}</tbody></table></div>
    <p class="note" style="margin:10px 0 0">Clique no título da coluna para ordenar. ${T('Δ R$', 'Δ NR R$')} = quanto somou ou tirou do ano.${T(' Caixas não comparam entre ferramentas (MTRIX e Colecta).', '')} A curva mostra 2025 em cinza, 2026 em rosa${comPl ? ' e o plano do Q4 tracejado' : ''}.</p>`;
}
function ponte(L, nomeFn) {
  const up = L.filter(x => x.dr > 0.5).sort((a, b) => b.dr - a.dr).slice(0, 6), dn = L.filter(x => x.dr < -0.5).sort((a, b) => a.dr - b.dr).slice(0, 6);
  const tot = L.reduce((s, x) => s + x.dr, 0);
  const lista = X => X.map(x => `<tr><td class="l b">${nomeFn(x.k)}</td><td>${dRS(x.dr)}</td><td>${vc(x.d)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Ninguém neste recorte.</td></tr>';
  const cab = `<thead><tr><th class="l">Nome</th><th>${T('Δ R$', 'Δ NR R$')}</th><th>26 vs 25</th></tr></thead>`;
  return `<h2 class="sec">Quem puxa e quem segura. <span>Variação ${T('do sell out', 'do NR')} em R$, ${corteTxt()} de 2026 contra 2025: ${dRS(tot)} no total.</span></h2><div class="grid g2">
    <div class="card"><p class="eyebrow">Mais somaram</p><div class="tw"><table>${cab}<tbody>${lista(up)}</tbody></table></div></div>
    <div class="card"><p class="eyebrow">Mais tiraram</p><div class="tw"><table>${cab}<tbody>${lista(dn)}</tbody></table></div></div></div>`;
}
function detalheChave(t, k, col, nome, op) {
  const o = {...op, sub: r => r[col] === k};
  let h = `<div class="det"><h2 class="sec">${nome}. <span>Curva do ano, marca a marca${col === COL.grp ? (MODO === 'si' ? ' e segmento a segmento' : '') : T(' e distribuidor a distribuidor', ' e cliente a cliente')}.</span></h2>` + bloco('det' + t + '_' + k, nome, o);
  const MK = dic.marca.map((m, i) => [i, `<span class="${mkCls(m)}">${tit(m)}</span>`]).filter(([i]) => i !== TODAS);
  h += `<div class="card"><p class="eyebrow">${nome} · marca a marca</p>${tabelaYTD('Marca', MK, r => r[COL.marca], o, true)}</div>`;
  if (col === COL.grp && MODO === 'si') h += `<div class="card"><p class="eyebrow">${nome} · segmento a segmento</p>${tabelaYTD('Segmento', dic.segmento.map((g, i) => [i, tit(g)]), r => r[COL.segmento], o)}</div>`;
  else if (col !== COL.grp) h += `<div class="card"><p class="eyebrow">${nome} · ${T('distribuidor a distribuidor', 'cliente a cliente')}</p>${tabelaYTD(T('Distribuidor', 'Cliente'), D.depara.map(d => [id('grp', d.grp), tit(d.grp), T(d.uf, tit(d.canal))]), r => r[COL.grp], o)}</div>`;
  return h + '</div>';
}

/* números do Q4 no recorte, só Hygiene (a base da régua do time): plano, Q4 de 2025 e o mês em curso no Order Management */
function q4Num(op) {
  const opH = {...op, sub: subHyg(op.sub)}, pa = umP('rs', opH), pc_ = umP('cx', opH), a = um('rs', opH), c = um('cx', opH);
  return {ar: agg(pa, 2026, Q4M, false), arM: Q4M.map(m => v(pa, 2026, m)), arC: agg(pc_, 2026, Q4M, false), arCM: Q4M.map(m => v(pc_, 2026, m)),
    q425: agg(a, 2025, Q4M, false), q425M: Q4M.map(m => v(a, 2025, m)), q425C: agg(c, 2025, Q4M, false), q425CM: Q4M.map(m => v(c, 2025, m)), om: om1({...op, so: 'hyg'}), mOM: omMes()};
}
function q4Resumo(op) {
  if (!temPlano(umP('rs', {...op, sub: subHyg(null)}))) return '<p class="note">Plano do Q4: este recorte não tem AR de Hygiene.</p>';
  const Q = Q4P(), N = q4Num(op), i = Q4M.indexOf(N.mOM), arm = i >= 0 ? N.arM[i] : NaN, ped = N.om.nfat + N.om.ncart;
  const nm = i >= 0 ? MES_LONGO[N.mOM - 1] : 'outubro';
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  return `<h2 class="sec">O Q4 em uma linha. <span>AR de Hygiene e ${nm} em curso no Order Management até ${omData()}.</span></h2><div class="grid g4">` +
    card('Plano do Q4 · Hygiene', mi(N.ar), `${vbig(varr(N.ar, N.q425))}<span>sobre o Q4 de 2025 em Hygiene (${mi(N.q425)})</span>`) +
    card(`AR de ${nm}`, mi(arm), `<span>${rq('piso_txt')}: ${mi(arm * Q.piso)}</span>`) +
    card(`Faturado em ${nm}`, mi(N.om.nfat), `${pctMeta(N.om.nfat / arm)}<span>do AR do mês · NR estimado</span>`) +
    card('Faturado + carteira', mi(ped), `${pctMeta(ped / arm)}<span>do AR do mês · falta ${mi(Math.max(0, arm - ped))}</span>`) +
    `</div><p class="note"><a href="#si-q4" data-act="pg" data-pg="si-q4">Abrir o Plano Q4 ›</a> com a meta por executivo, cliente e marca. A régua do variável e os itens da campanha estão no <a href="#si-rv" data-act="pg" data-pg="si-rv">RV</a>.</p>`;
}

function pgSiInicio() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  const side = `<div class="side">${(D.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Corte ${mes(S.corte)}/26 · Order Management de ${omData()}</div>`;
  let h = hero('', 'Governança CTO.', 'Sell in do Centro-Oeste, mês a mês, com o plano do Q4.', side);
  const pn = [['si-geral', 'Total', null], ...MK_HYG.map(m => ['si-' + m.toLowerCase(), tit(m), MARCA_PAG['si-' + m.toLowerCase()]]), ['si-hn', 'H&N', MK_HN_SI]];
  h += '<div class="pnav">' + pn.map(([pg, nome, mk]) => {
    const a = um('rs', {marcas: mk ? marcasDe(mk) : op.marcas, segs: op.segs}), d = varr(ytd(a, 2026, 'rs'), ytd(a, 2025, 'rs'));
    return `<a href="#${pg}" data-act="pg" data-pg="${pg}"><div class="mk ${mkCls(mk && mk[0])}">${nome}</div><div class="v">${mi(ytd(a, 2026, 'rs'))} · ${vc(d)}</div></a>`;
  }).join('') + '</div>';
  h += recorteTxt();
  h += `<h2 class="sec">O ano em números. <span>NR e caixas de ${corteTxt()} contra o mesmo período de 2025.</span></h2>` + kpis(op);
  h += q4Resumo(op);
  // marcas
  const chM = r => r[COL.marca];
  const R = cubo('rs', {chave: chM, segs: op.segs}), PR = cuboP('rs', {chave: chM, segs: op.segs});
  h += `<h2 class="sec">As marcas. <span>Cada uma com a sua curva; out a dez em cinza é o plano.</span></h2><div class="shelf">` + [...MK_HYG, 'SUSTAGEN', 'JONTEX', 'OLLA', 'VEET'].map(m => {
    const k = id('marca', m), a = R.get(k); if (!a) return '';
    const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs'), pg = MARCA_PAG['si-' + m.toLowerCase()] ? 'si-' + m.toLowerCase() : 'si-hn';
    return `<a class="card" href="#${pg}" data-act="pg" data-pg="${pg}"><p class="eyebrow ${mkCls(m)}">${tit(m)}</p><div class="kpi"><div class="val" style="font-size:30px">${mi(y26)}</div>
      <div class="sub">${vc(varr(y26, y25))} sobre 2025</div></div>${chart(a, 'rs', 120, 244, false, {plano: PR.get(k)}).replace(/<div class="legend">.*<\/div>$/, '')}</a>`;
  }).join('') + '</div>';
  // clientes
  const L = curvasDados(r => r[COL.grp], op).filter(x => isFinite(x.r26)).sort((a, b) => b.r26 - a.r26);
  h += `<h2 class="sec">Os clientes. <span>Quem puxa e quem segura o ano.</span></h2><div class="shelf">` + L.map(x => {
    const nome = dic.grp[x.k], d = infoGrp(nome);
    return `<a class="card kpi" href="#si-clientes" data-act="pg" data-pg="si-clientes"><p class="eyebrow">${d ? tit(d.canal) : ''}</p><h3>${tit(nome)}</h3><div class="val" style="font-size:28px">${mi(x.r26)}</div>
      <div class="sub">${vc(x.d)} sobre 2025${d ? ' · ' + esc(d.executivo) : ''}</div>${spark(x.a, x.pa)}</a>`;
  }).join('') + '</div>';
  h += ponte(curvasDados(r => r[COL.grp], op), k => tit(dic.grp[k]));
  const IDX = [['si-geral', 'Dados gerais', 'Total da carteira: NR e caixas mês a mês com o plano do Q4, NR por caixa, marca a marca, canal, BU, cliente e executivo.'],
    ['si-veja', 'Veja', 'Visão marca e segmentos, com as curvas por cliente dentro da marca.'], ['si-vanish', 'Vanish', 'Líquido, pó, barra e Vanish Others.'],
    ['si-harpic', 'Harpic', 'Pedra, ITC, ITB, líquido, blocos e Click Gel.'], ['si-finish', 'Finish', 'Pó, secante e tabletes.'],
    ['si-hn', 'H&N', 'Jontex e Olla, Sustagen, Veet e as outras marcas de Health, com o AR do Q4 de H&N.'],
    ['si-diretor', 'Visão do Diretor', 'Cliente x marca x ano no acumulado, com o plano do Q4 ao lado.'],
    ['si-clientes', 'Clientes', 'Curvas de crescimento e queda por cliente, quem soma e quem tira do ano.'],
    ['si-exec', 'Executivos', 'As mesmas curvas por executivo, com a carteira de clientes de cada um.'],
    ['si-q4', 'Plano Q4', 'AR por mês, executivo, cliente e marca, com a escada da regional.'],
    ['si-mes', 'Mês em curso', 'Order Management: faturado, carteira, alocação e carteira futura contra o AR do mês.'],
    ['si-rv', 'RV', 'Faixa de NR de cada executivo no mês, marcos do trimestre, itens da campanha e a régua.'],
    ['si-base', 'Base geral', 'A base longa do P&L Restated, filtrada pelas segmentações, com download.']];
  h += `<h2 class="sec">O índice. <span>A mesma lógica da perna Sell Out.</span></h2><div class="grid g3">` +
    IDX.map(([pg, n, d], i) => `<a class="card idx" href="#${pg}" data-act="pg" data-pg="${pg}" style="color:inherit;text-decoration:none"><p class="eyebrow">${String(i + 1).padStart(2, '0')}</p><h4>${n}</h4><p>${d}</p><div class="go"><span style="color:var(--link)">Abrir ›</span></div></a>`).join('') + '</div>';
  h += `<h2 class="sec">Como ler. <span>Regras da perna Sell In.</span></h2><div class="card"><ol class="num">
    <li>As segmentações no topo valem para a perna inteira: marcar um executivo filtra também marcas, clientes, o plano do Q4 e o mês em curso. O link da página guarda o recorte.</li>
    <li>O botão Excel, na barra das segmentações, baixa as tabelas da página aberta já no recorte marcado.</li>
    ${(D.regras || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
  return h;
}

function pgSiGeral() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('Dados gerais', 'Total da carteira.', 'Sell in do CTO em NR e caixas, mês a mês; out a dez de 2026 em cinza é o plano do Q4.') + recorteTxt() + kpis(op);
  h += `<h2 class="sec">Visão total. <span>NR e caixas num card só, com o plano do Q4.</span></h2>` + bloco('sgeral', 'Total', op);
  const r = um('rs', op), c = um('cx', op), pr = umP('rs', op), pcx = umP('cx', op);
  const tp = temPlano(pr);
  h += `<h2 class="sec">NR por caixa. <span>Quanto vale cada caixa vendida, mês a mês.</span></h2><div class="card"><h3>R$ ${n2(ytd(r, 2026, 'rs') / ytd(c, 2026, 'cx'))} no acumulado de 2026. <span>Contra R$ ${n2(ytd(r, 2025, 'rs') / ytd(c, 2025, 'cx'))} em 2025.</span></h3>
    <div class="tw"><table><thead><tr><th>Mês</th>${ANOS.map(y => `<th>${y}</th>`).join('')}${tp ? '<th>Plano Q4</th>' : ''}<th>26 vs 25</th></tr></thead><tbody>` +
    ate(12).map(m => { const q = y => v(r, y, m) / v(c, y, m), p = v(pr, 2026, m) / v(pcx, 2026, m);
      return `<tr><td class="b">${MESES[m - 1]}</td>${ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n2(q(y))}</td>`).join('')}${tp ? `<td class="pl">${n2(p)}</td>` : ''}<td>${vc(varr(q(2026), q(2025)))}</td></tr>`; }).join('') +
    '</tbody></table></div></div>';
  const MK = dic.marca.map((m, i) => [i, `<span class="${mkCls(m)}">${tit(m)}</span>`]);
  h += `<h2 class="sec">Marca a marca. <span>Acumulado de ${corteTxt()}; o plano do Q4 ao lado.</span></h2><div class="card">` + tabelaYTD('Marca', MK, r_ => r_[COL.marca], op) + '</div>';
  h += `<h2 class="sec">Canal a canal. <span>Canal L2 do P&L.</span></h2><div class="card">` + tabelaYTD('Canal', dic.canal.map((x, i) => [i, tit(x)]), r_ => r_[COL.canal], op) + '</div>';
  h += `<h2 class="sec">BU a BU. <span>Cada BU com o seu AR do Q4; a página Plano Q4 usa só Hygiene.</span></h2><div class="card">` + tabelaYTD('BU', dic.uf.map((x, i) => [i, esc(x)]), r_ => r_[COL.uf], op) + '</div>';
  h += `<h2 class="sec">Cliente a cliente. <span>Ordenado pelo NR de 2026.</span></h2><div class="card">` + tabelaYTD('Cliente', D.depara.map(d => [id('grp', d.grp), tit(d.grp), tit(d.canal)]), r_ => r_[COL.grp], op) + '</div>';
  h += `<h2 class="sec">Executivo a executivo. <span>Carteira atual de cada um, com o histórico dos clientes.</span></h2><div class="card">` + tabelaYTD('Executivo', dic.executivo.map((x, i) => [i, esc(x)]), r_ => r_[COL.executivo], op) + '</div>';
  return h;
}

function pgSiClientes() {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[COL.grp], op);
  let h = hero('Clientes', 'Curvas por cliente.', `Quem cresce e quem cai no sell in, ${corteTxt()} de 2026 contra 2025, com o plano do Q4.`) + recorteTxt();
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>NR de ${corteTxt()}, 2026 contra 2025, por cliente.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, k => tit(dic.grp[k]));
  h += `<h2 class="sec">Cliente a cliente. <span>Clique no nome para abrir a curva, as marcas e os segmentos.</span></h2><div class="card">` +
    tabelaCurvas('cli', 'Cliente', L, k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? `${tit(d.canal)} · ${esc(d.executivo)}` : ''; }) + '</div>';
  const sl = S.ui.selcli;
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) h += detalheChave('cli', +sl, COL.grp, tit(dic.grp[+sl]), op);
  h += (D.notas_clientes || []).map(t => `<p class="note">${esc(t)}</p>`).join('');
  return h;
}
function pgSiExec() {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[COL.executivo], op);
  let h = hero('Executivos', 'Curvas por executivo.', `Carteira atual de cada executivo, ${corteTxt()} de 2026 contra 2025, com o plano do Q4.`) + recorteTxt();
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>NR de ${corteTxt()}, 2026 contra 2025, por executivo.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, k => esc(dic.executivo[k]));
  h += `<h2 class="sec">Executivo a executivo. <span>Clique no nome para abrir a curva, as marcas e a carteira de clientes.</span></h2><div class="card">` +
    tabelaCurvas('exe', 'Executivo', L, k => esc(dic.executivo[k]), null) + '</div>';
  const sl = S.ui.selexe;
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) {
    const k = +sl, Lc = curvasDados(r => r[COL.grp], {...op, sub: r => r[COL.executivo] === k});
    h += detalheChave('exe', k, COL.executivo, esc(dic.executivo[k]), op);
    h += `<div class="card"><p class="eyebrow">${esc(dic.executivo[k])} · curvas por cliente</p>${tabelaCurvas('exc' + k, 'Cliente', Lc, x => tit(dic.grp[x]), x => { const d = infoGrp(dic.grp[x]); return d ? tit(d.canal) : ''; })}</div>`;
  }
  h += (D.notas_exec || []).map(t => `<p class="note">${esc(t)}</p>`).join('');
  return h;
}

/* executivos no Q4 (só Hygiene): meta, mês em curso no Order Management e itens da campanha; usado no Plano Q4 e no RV */
function execQ4(op) {
  const hy = idHyg(), ehH = r => r[COL.uf] === hy, opH = {...op, sub: ehH}, Q = Q4P(), N = q4Num(op), iM = Q4M.indexOf(N.mOM);
  const semRecorte = !FILTROS.some(([k]) => S.f[k].size);
  const chE = r => r[COL.executivo], P = cuboP('rs', {...opH, chave: chE}), PC = cuboP('cx', {...opH, chave: chE}), A25 = cubo('rs', {...opH, chave: chE});
  const OM = omSoma({...op, so: 'hyg', chave: l => l[1]}), I2 = id('segmento', Q.seg_item2 || '');
  const I1 = cuboP('cx', {...op, sub: r => r[14] === 1, chave: chE}), I1R = cuboP('rs', {...op, sub: r => r[14] === 1, chave: chE});
  const I2P = cuboP('rs', {...opH, sub: r => ehH(r) && r[COL.segmento] === I2, chave: chE}), I2O = omSoma({...op, so: 'hyg', sub: l => l[5] === I2, chave: l => l[1]});
  const car = nome => (D.cenarios && D.cenarios.carteiras || []).find(c => c.exec === nome) || {};
  const prev = Q4M.filter(m => m < N.mOM), RP = cubo('rs', {...opH, chave: chE, semCorte: true}), OMA = new Map();
  prev.filter(m => m > D.ult26).forEach(m => omSoma({...op, so: 'hyg', chave: l => l[1], linhas: OMB_ANT.filter(l => l[16] === m)}).forEach((o, k) => OMA.set(k, (OMA.get(k) || 0) + o.nfat)));
  const realAnt = k => prev.reduce((t, m) => t + (m <= D.ult26 && RP.get(k) ? (v(RP.get(k), 2026, m) || 0) : 0), 0) + (OMA.get(k) || 0);
  const ex = [...P.keys()].map(k => {
    const pa = P.get(k), o = Object.assign({...ZERO_OM}, OM.get(k) || {}), a = A25.get(k), i1 = I1.get(k), i2 = I2P.get(k), i2o = Object.assign({...ZERO_OM}, I2O.get(k) || {});
    const arQ = agg(pa, 2026, Q4M, false), arMes = iM >= 0 ? v(pa, 2026, N.mOM) : NaN, arM3 = Q4M.map(m => v(pa, 2026, m));
    return {k, nome: dic.executivo[k], arQ, arMes, arM3, real: realAnt(k), q425: a ? agg(a, 2025, Q4M, false) : NaN, arC: agg(PC.get(k), 2026, Q4M, false), o, rec: semRecorte ? car(dic.executivo[k]).rec : NaN,
      i1AR: i1 ? agg(i1, 2026, Q4M, false) : NaN, i1RS: I1R.get(k) ? agg(I1R.get(k), 2026, Q4M, false) : NaN, i2AR: i2 ? agg(i2, 2026, Q4M, false) : NaN, i2Ped: i2o.nfat + i2o.ncart};
  }).filter(x => x.arQ > 0).sort((a, b) => b.arQ - a.arQ);
  return {ex, N, iM, Q, semRecorte, nomeM: iM >= 0 ? MES_LONGO[N.mOM - 1] : 'mês'};
}
/* ----- Plano do Q4 (só Hygiene; parâmetros e textos da régua vêm do arquivo de dados cifrado) ----- */
function regrasQ4() {
  return `<h2 class="sec">A régua do variável. <span>${tq('regua')}</span></h2><div class="card"><ol class="num">${(D.regras_q4 || []).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
    <p class="note" style="margin:12px 0 0">O site mostra metas e atingimento. Valores de salário e de RV individual ficam fora.</p></div>`;
}
const notaL4 = () => ((S.f.recorte.size || S.f.canal.size) && D.nota_l4_om ? `<p class="note">${esc(D.nota_l4_om)}</p>` : '');
function pgSiQ4() {
  const op = {marcas: gMarcas(), segs: gSegs()}, hy = idHyg(), ehH = r => r[COL.uf] === hy, opH = {...op, sub: ehH}, Q = Q4P();
  let h = hero('Plano Q4', 'O plano do Q4.', `AR oficial de 29/09 em Hygiene, o Q4 de 2025 e o mês em curso no Order Management até ${omData()}.`) + recorteTxt();
  if (!temPlano(umP('rs', opH))) return h + notaL4() + '<div class="card"><div class="empty">Este recorte não tem AR de Hygiene no Q4.</div></div><p class="note"><a href="#si-rv" data-act="pg" data-pg="si-rv">Abrir o RV ›</a> com a régua do variável.</p>';
  h += `<p class="note">${tq('base')}</p>` + notaL4();
  const N = q4Num(op), iM = Q4M.indexOf(N.mOM), arm = iM >= 0 ? N.arM[iM] : NaN, ped = N.om.nfat + N.om.ncart, nomeM = iM >= 0 ? MES_LONGO[N.mOM - 1] : 'mês';
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g4">` + card('Plano do Q4 · Hygiene', mi(N.ar), `${vbig(varr(N.ar, N.q425))}<span>sobre o Q4 de 2025 em Hygiene (${mi(N.q425)})</span>`) +
    card('Caixas do plano', n0(N.arC), `${vbig(varr(N.arC, N.q425C))}<span>sobre ${n0(N.q425C)} caixas no Q4 de 2025</span>`) +
    card(`Faturado em ${nomeM}`, mi(N.om.nfat), `${pctMeta(N.om.nfat / arm)}<span>do AR de ${nomeM} (${mi(arm)})</span>`) +
    card('Faturado + carteira', mi(ped), `${pctMeta(ped / arm)}<span>do AR · ${rq('piso_txt')}: ${mi(arm * Q.piso)}</span>`) + '</div>';
  // mês a mês
  h += `<h2 class="sec">Mês a mês. <span>${tq('mes_a_mes')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Mês</th><th>AR NR</th><th>AR caixas</th><th>Peso no Q4</th><th>${rq('piso')}</th><th>${rq('alvo')}</th><th>Q4 2025 NR</th><th>AR vs 25</th><th>NR/cx AR</th><th>NR/cx 25</th></tr></thead><tbody>` +
    Q4M.map((m, i) => `<tr><td class="l b">${MESES[m - 1]}</td><td class="b">${n0(N.arM[i])}</td><td>${n0(N.arCM[i])}</td><td>${p1(N.arM[i] / N.ar)}</td><td>${n0(N.arM[i] * Q.piso)}</td><td>${n0(N.arM[i] * Q.alvo)}</td><td>${n0(N.q425M[i])}</td><td>${vc(varr(N.arM[i], N.q425M[i]))}</td><td>${n2(N.arM[i] / N.arCM[i])}</td><td>${n2(N.q425M[i] / N.q425CM[i])}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Q4</td><td>${n0(N.ar)}</td><td>${n0(N.arC)}</td><td>${p1(1)}</td><td>${n0(N.ar * Q.piso)}</td><td>${n0(N.ar * Q.alvo)}</td><td>${n0(N.q425)}</td><td>${vc(varr(N.ar, N.q425))}</td><td>${n2(N.ar / N.arC)}</td><td>${n2(N.q425 / N.q425C)}</td></tr></tbody></table></div></div>`;
  // escada de cenários da regional (só sem recorte: os cenários são da regional inteira)
  const semRecorte = !FILTROS.some(([k]) => S.f[k].size);
  if (semRecorte && D.cenarios) {
    const esc_ = D.cenarios.regional, mx = Math.max(...esc_.map(x => x[1])), ar = N.ar;
    h += `<h2 class="sec">A escada da regional. <span>${tq('escada')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Cenário</th><th class="l">Origem</th><th>NR do Q4</th><th>% do AR</th><th>vs Q4 2025</th><th class="l"></th></tr></thead><tbody>` +
      esc_.map(([n, val, orig]) => `<tr><td class="l b">${esc(n)}</td><td class="l">${esc(orig)}</td><td class="b">${n0(val)}</td><td>${p1(val / ar)}</td><td>${vc(varr(val, N.q425))}</td><td class="l"><div class="barra"><i class="${Math.abs(val - ar) < 1 ? 'pk' : ''}" style="width:${(val / mx * 100).toFixed(1)}%"></i></div></td></tr>`).join('') +
      `</tbody></table></div><p class="note" style="margin:12px 0 0">Q4 de 2025 realizado em Hygiene: ${mi(N.q425)}. ${tq('escada_nota')}</p></div>`;
  }
  // por executivo: meta e mês em curso
  const {ex} = execQ4(op);
  const falta = (x, alvo) => (!(alvo > 0) ? '' : alvo - x > 0.5 ? n0(alvo - x) : '<span class="vr up">batido</span>');
  h += `<h2 class="sec">Executivo a executivo. <span>Meta do Q4 em Hygiene e ${nomeM} em curso. Faturado e carteira em NR estimado pelo NR por caixa do segmento.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th><th>AR Q4</th><th>${rq('alvo')}</th><th>${rq('rec')}</th><th>Q4 2025</th><th>AR vs 25</th>
    <th>AR ${nomeM}</th><th>${rq('piso')}</th><th>Faturado</th><th>Carteira + alocação</th><th>% do AR</th><th>${rq('falta_piso')}</th><th>${rq('falta_100')}</th></tr></thead><tbody>` +
    ex.map(x => { const pd = x.o.nfat + x.o.ncart;
      return `<tr><td class="l b">${esc(x.nome)}</td><td class="b">${n0(x.arQ)}</td><td>${n0(x.arQ * Q.alvo)}</td><td>${n0(x.rec)}</td><td>${n0(x.q425)}</td><td>${vc(varr(x.arQ, x.q425))}</td>
        <td class="b">${n0(x.arMes)}</td><td>${n0(x.arMes * Q.piso)}</td><td>${n0(x.o.nfat)}</td><td>${n0(x.o.ncart)}</td><td>${pctMeta(pd / x.arMes)}</td><td>${falta(pd, x.arMes * Q.piso)}</td><td>${falta(pd, x.arMes)}</td></tr>`; }).join('') +
    (() => { const t = f => ex.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0), pd = t(x => x.o.nfat + x.o.ncart), am = t(x => x.arMes);
      return `<tr class="tot"><td class="l">Total</td><td>${n0(t(x => x.arQ))}</td><td>${n0(t(x => x.arQ) * Q.alvo)}</td><td>${semRecorte ? n0(t(x => x.rec)) : ''}</td><td>${n0(t(x => x.q425))}</td><td>${vc(varr(t(x => x.arQ), t(x => x.q425)))}</td>
        <td>${n0(am)}</td><td>${n0(am * Q.piso)}</td><td>${n0(t(x => x.o.nfat))}</td><td>${n0(t(x => x.o.ncart))}</td><td>${pctMeta(pd / am)}</td><td>${falta(pd, am * Q.piso)}</td><td>${falta(pd, am)}</td></tr>`; })() +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">${tq('exec_nota')}</p></div>`;
  // por cliente
  const chG = r => r[COL.grp], PG = cuboP('rs', {...opH, chave: chG}), AG = cubo('rs', {...opH, chave: chG}), OG = omSoma({...op, so: 'hyg', chave: l => l[0]});
  const cl = [...PG.keys()].map(k => { const pa = PG.get(k), a = AG.get(k), o = Object.assign({...ZERO_OM}, OG.get(k) || {});
    return {k, m: Q4M.map(m => v(pa, 2026, m)), q: agg(pa, 2026, Q4M, false), q25: a ? agg(a, 2025, Q4M, false) : NaN, ped: o.nfat + o.ncart, fat: o.nfat}; }).filter(x => x.q > 0).sort((a, b) => b.q - a.q);
  h += `<h2 class="sec">Cliente a cliente. <span>AR de Hygiene por mês contra o Q4 de 2025 e o pedido de ${nomeM} em mãos.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Cliente</th><th class="l">Executivo</th>${Q4M.map(m => `<th>AR ${mes(m)}</th>`).join('')}<th>AR Q4</th><th>Q4 2025</th><th>AR vs 25</th><th>Faturado ${nomeM}</th><th>Fat. + carteira</th><th>% do AR ${nomeM}</th></tr></thead><tbody>` +
    cl.map(x => { const d = infoGrp(dic.grp[x.k]), am = iM >= 0 ? x.m[iM] : NaN;
      return `<tr><td class="l b">${tit(dic.grp[x.k])}</td><td class="l">${d ? esc(d.executivo) : ''}</td>${x.m.map(y => `<td>${n0(y)}</td>`).join('')}<td class="b">${n0(x.q)}</td><td>${n0(x.q25)}</td><td>${vc(varr(x.q, x.q25))}</td><td>${n0(x.fat)}</td><td>${n0(x.ped)}</td><td>${pctMeta(x.ped / am)}</td></tr>`; }).join('') +
    '</tbody></table></div></div>';
  // por marca e segmento
  const chS = r => r[COL.marca] + '|' + r[COL.segmento], PS = cuboP('rs', {...opH, chave: chS}), PSC = cuboP('cx', {...opH, chave: chS}), AS = cubo('rs', {...opH, chave: chS}), ASC = cubo('cx', {...opH, chave: chS});
  const sg = [...PS.keys()].map(k => { const [m, g] = k.split('|').map(Number); return {m, g, q: agg(PS.get(k), 2026, Q4M, false), qc: agg(PSC.get(k), 2026, Q4M, false), q25: AS.get(k) ? agg(AS.get(k), 2025, Q4M, false) : NaN, qc25: ASC.get(k) ? agg(ASC.get(k), 2025, Q4M, false) : NaN}; })
    .sort((a, b) => a.m - b.m || b.q - a.q);
  h += `<h2 class="sec">Marca e segmento. <span>O plano do Q4 contra o Q4 de 2025, em NR e caixas.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Marca</th><th class="l">Segmento</th><th>AR Q4 NR</th><th>Q4 2025 NR</th><th>Var. NR</th><th>AR Q4 caixas</th><th>Q4 2025 caixas</th><th>Var. caixas</th></tr></thead><tbody>` +
    sg.map(x => `<tr><td class="l b ${mkCls(dic.marca[x.m])}">${tit(dic.marca[x.m])}</td><td class="l">${tit(dic.segmento[x.g])}</td><td class="b">${n0(x.q)}</td><td>${n0(x.q25)}</td><td>${vc(varr(x.q, x.q25))}</td><td>${n0(x.qc)}</td><td>${n0(x.qc25)}</td><td>${vc(varr(x.qc, x.qc25))}</td></tr>`).join('') +
    '</tbody></table></div><p class="note" style="margin:12px 0 0">O P&L não separa o VPS concentrado do diluído: no plano, os dois somam em VPS.</p></div>';
  return h + `<p class="note"><a href="#si-rv" data-act="pg" data-pg="si-rv">Abrir o RV ›</a> com a régua do variável, a faixa de cada executivo e os itens da campanha.</p>`;
}

/* ----- RV: onde cada executivo está na régua do Q4 (textos e faixas vêm do arquivo cifrado; sem salário nem valor de RV) ----- */
function pgSiRV() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  let h = hero('RV', 'O variável do time.', tq('rv_sub'));
  if (!temPlano(umP('rs', {...op, sub: subHyg(null)}))) return h + notaL4() + '<div class="card"><div class="empty">Este recorte não tem AR de Hygiene no Q4.</div></div>' + regrasQ4();
  const {ex, Q, nomeM, N} = execQ4(op);
  const pctMeta = x => pctMetaG(isFinite(x) ? Math.floor(x * 1000 + 1e-9) / 1000 : x);   // trunca: 99,96% não aparece como 100,0%
  const ant = Q4M.filter(m => m < N.mOM);
  h += `<p class="note">${tq('rv_base')}${ant.length ? ` O trimestre soma ${ant.map(m => `${MES_LONGO[m - 1]} (${m <= D.ult26 ? 'P&L fechado' : 'último Order Management do mês'})`).join(' e ')} ao mês em curso.` : ''}</p>` + notaL4();
  const faixas = (Q.escala || []).slice().sort((a, b) => b[0] - a[0]);
  const faixa = x => { if (!isFinite(x)) return ''; const e = faixas.find(([lim]) => x >= lim - 1e-9); return e ? `<span class="vr ${x >= 1 ? 'up' : 'warn'}">${esc(e[1])}</span>` : `<span class="vr down">${rq('abaixo')}</span>`; };
  const marco = (feito, alvo, rot) => (!(alvo > 0) ? '' : feito >= alvo - 0.5 ? `<span class="vr up">${rot}</span>` : 'falta ' + n0(alvo - feito));
  const t = f => ex.reduce((s, x) => s + (isFinite(f(x)) ? f(x) : 0), 0);
  const pedM = t(x => x.o.nfat + x.o.ncart), arM = t(x => x.arMes), arQ = t(x => x.arQ), pedQ = t(x => x.real + x.o.nfat + x.o.ncart + x.o.nfut);
  const naFaixa = ex.filter(x => (x.o.nfat + x.o.ncart) / x.arMes >= (faixas.length ? faixas[faixas.length - 1][0] : 1)).length;
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g3">` + card(`Time em ${nomeM}`, mi(pedM), `${pctMeta(pedM / arM)}<span>do AR de ${mi(arM)} · ${faixa(pedM / arM)}</span>`) +
    card('Q4 em pedidos', mi(pedQ), `${pctMeta(pedQ / arQ)}<span>do AR do Q4 (${mi(arQ)})</span>`) +
    card('Executivos já na faixa', `${naFaixa} de ${ex.length}`, `<span>no NR de ${nomeM}, com o pedido de hoje</span>`) + '</div>';
  h += `<h2 class="sec">Executivo a executivo. <span>Faixa de NR de ${nomeM} e os marcos do trimestre.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>
    <th>AR ${nomeM}</th><th>Pedido ${nomeM}</th><th>% do AR</th><th class="l">${rq('faixa_col')}</th><th class="l">${rq('acel_col')}</th><th>AR Q4</th><th>Pedidos Q4</th><th>% do Q4</th><th class="l">${rq('marco_q4_col')}</th><th class="l">${rq('alvo')}</th></tr></thead><tbody>` +
    ex.map(x => { const pd = x.o.nfat + x.o.ncart, pq = x.real + x.o.nfat + x.o.ncart + x.o.nfut;
      return `<tr><td class="l b">${esc(x.nome)}</td><td>${n0(x.arMes)}</td><td class="b">${n0(pd)}</td><td>${pctMeta(pd / x.arMes)}</td><td class="l">${faixa(pd / x.arMes)}</td><td class="l">${marco(pd, x.arMes * Q.piso, rq('destravado'))}</td>
        <td>${n0(x.arQ)}</td><td class="b">${n0(pq)}</td><td>${pctMeta(pq / x.arQ)}</td><td class="l">${marco(pq, x.arQ, rq('atingido'))}</td><td class="l">${marco(pq, x.arQ * Q.alvo, rq('atingido'))}</td></tr>`; }).join('') +
    `<tr class="tot"><td class="l">Time</td><td>${n0(arM)}</td><td>${n0(pedM)}</td><td>${pctMeta(pedM / arM)}</td><td class="l">${faixa(pedM / arM)}</td><td class="l">${marco(pedM, arM * Q.piso, rq('destravado'))}</td><td>${n0(arQ)}</td><td>${n0(pedQ)}</td><td>${pctMeta(pedQ / arQ)}</td><td class="l">${marco(pedQ, arQ, rq('atingido'))}</td><td class="l">${marco(pedQ, arQ * Q.alvo, rq('atingido'))}</td></tr>` +
    `</tbody></table></div></div>`;
  h += `<h2 class="sec">Meta de cada mês. <span>AR de Hygiene por executivo e o mínimo de cada mês.</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>` +
    Q4M.map(m => `<th>AR ${mes(m)}</th><th>${rq('piso')} ${mes(m)}</th>`).join('') + `<th>AR Q4</th></tr></thead><tbody>` +
    ex.map(x => `<tr><td class="l b">${esc(x.nome)}</td>${x.arM3.map(a => `<td class="b">${n0(a)}</td><td>${n0(a * Q.piso)}</td>`).join('')}<td class="b">${n0(x.arQ)}</td></tr>`).join('') +
    `<tr class="tot"><td class="l">Time</td>${Q4M.map((m, i) => { const a = t(x => x.arM3[i]); return `<td>${n0(a)}</td><td>${n0(a * Q.piso)}</td>`; }).join('')}<td>${n0(arQ)}</td></tr></tbody></table></div></div>`;
  // itens da campanha
  h += `<h2 class="sec">Itens da campanha. <span>${tq('itens')}</span></h2><div class="card"><div class="tw"><table><thead><tr><th class="l">Executivo</th>
    <th>${rq('item1')} AR (cx)</th><th>${rq('regua1')} (cx)</th><th>${rq('item1')} AR (R$)</th><th>${rq('item1')} pedido ${nomeM} (cx)</th><th>% da régua</th><th>${rq('item2')} AR (R$)</th><th>${rq('item2')} pedido ${nomeM} (R$)</th><th>% do AR</th><th>${rq('booster')}</th><th>Pedidos no OM (R$)</th><th>% do AR Q4</th></tr></thead><tbody>` +
    ex.map(x => { const pedQ = x.real + x.o.nfat + x.o.ncart + x.o.nfut, r1 = x.i1AR * Q.regua_item1, r2 = x.i2AR * Q.regua_item2;
      return `<tr><td class="l b">${esc(x.nome)}</td><td>${n0(x.i1AR)}</td><td class="b">${n0(r1)}</td><td>${n0(x.i1RS)}</td><td>${n0(x.o.vped)}</td><td>${p1(x.o.vped / r1)}</td>
        <td class="b">${n0(x.i2AR)}</td><td>${n0(x.i2Ped)}</td><td>${p1(x.i2Ped / r2)}</td><td class="b">${n0(x.arQ)}</td><td>${n0(pedQ)}</td><td>${p1(pedQ / x.arQ)}</td></tr>`; }).join('') +
    `</tbody></table></div><p class="note" style="margin:12px 0 0">${tq('itens_nota')}</p></div>`;
  h += `<p class="note">${tq('rv_fora')}</p>`;
  return h + regrasQ4();
}

/* ----- Sell Out: curvas por distribuidor e por executivo (as redes compradoras ficam nas abas de Clientes) ----- */
const abasMarcas = pg => { const si = MODO === 'si' ? 'si-' : ''; return `<div class="pills" style="margin:0 0 18px">${[['geral', 'Total'], ['veja', 'Veja'], ['vanish', 'Vanish'], ['harpic', 'Harpic'], ['finish', 'Finish'], ['hn', 'H&N']].map(([p, n]) => `<button data-act="pg" data-pg="${si + p}" class="${si + p === pg ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
const comAbasMarca = (html, pg) => { const i = html.indexOf('</section>'); return i < 0 ? abasMarcas(pg) + html : html.slice(0, i + 10) + abasMarcas(pg) + html.slice(i + 10); };
const abasClientesSO = pg => `<div class="pills" style="margin:0 0 18px">${[['clientes', 'Distribuidores'], ['redes-col', 'Redes Colecta'], ['redes-scan', 'Redes Scanntech']].map(([p, n]) => `<button data-act="pg" data-pg="${p}" class="${p === pg ? 'on' : ''}">${n}</button>`).join('')}</div>`;
const comAbas = (html, pg) => {
  const j = !SLIDE && innerWidth <= 640 ? html.indexOf('<div class="card shareuf"') : -1;   // celular: as abas vêm antes do market share por UF, que é alto
  if (j >= 0) return html.slice(0, j) + abasClientesSO(pg) + html.slice(j);
  const i = html.indexOf('</section>'); return i < 0 ? abasClientesSO(pg) + html : html.slice(0, i + 10) + abasClientesSO(pg) + html.slice(i + 10); };
function pgSoCurvas(t, col, rot, plural, nomeFn, extraFn, sub) {
  const op = {marcas: gMarcas(), segs: gSegs()}, L = curvasDados(r => r[col], op);
  let h = `<h2 class="sec">Quantas crescem e quantas caem. <span>Sell out de ${corteTxt()}, 2026 contra 2025, por ${rot.toLowerCase()}.</span></h2>` + termometro(L.map(x => ({v: x.d})));
  h += ponte(L, nomeFn);
  h += `<h2 class="sec">${plural}. <span>${sub}</span></h2><div class="card">` + tabelaCurvas(t, rot, L, nomeFn, extraFn) + '</div>';
  const sl = S.ui['sel' + t];
  if (sl !== undefined && sl !== '' && L.some(x => String(x.k) === String(sl))) h += detalheChave(t, +sl, col, nomeFn(+sl), op);
  return h;
}
function pgSoClientes() {
  return hero('Clientes', 'Curvas por distribuidor.', `Quem cresce e quem cai no sell out, ${corteTxt()} de 2026 contra 2025. As redes compradoras estão nas abas.`) + abasClientesSO('clientes') +
    pgSoCurvas('cliso', COL.grp, 'Distribuidor', 'Distribuidor a distribuidor', k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? `${esc(d.uf)} · ${esc(d.executivo)}` : ''; }, 'Clique no nome para abrir a curva e as marcas.');
}
function pgSoExec() {
  return hero('Executivos', 'Curvas por executivo.', `Sell out da carteira de cada executivo, ${corteTxt()} de 2026 contra 2025.`) +
    pgSoCurvas('exeso', COL.executivo, 'Executivo', 'Executivo a executivo', k => tit(dic.executivo[k]), null, 'Clique no nome para abrir a curva, as marcas e os distribuidores.');
}

/* ----- Mês em curso (Order Management, todas as BUs, cada uma contra o seu AR) ----- */
function pgSiMes() {
  const op = {marcas: gMarcas(), segs: gSegs()}, M = omMes();
  const vd = validade();
  let h = hero('Mês em curso', `${isFinite(M) ? MES_LONGO[M - 1][0].toUpperCase() + MES_LONGO[M - 1].slice(1) + ' de 2026' : 'O mês'} no Order Management.`, `Faturado (GIT), carteira, processo de alocação e carteira futura até ${omData()}. NR estimado pelo NR por caixa do segmento no P&L.`) + recorteTxt() + notaL4() +
    (vd && vd.velho ? `<p class="note"><span class="selo warn">${esc(vd.txt)}</span> Os pedidos estão desatualizados: o próximo export do Order Management republica o site sozinho.</p>` : '');
  if (!D.om) return h + '<div class="card"><div class="empty">Sem Order Management nesta versão.</div></div>';
  const t = om1(op), pa = umP('rs', op), arm = isFinite(M) ? v(pa, 2026, M) : NaN, ped = t.nfat + t.ncart;
  const card = (lab, val, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${sub}</div></div>`;
  h += `<div class="grid g3">` + card('Faturado', n0(t.fat) + ' cx', `<span>${mi(t.nfat)} de NR estimado</span>`) + card('Carteira liberada', n0(t.cart) + ' cx', '<span>pedido sem bloqueio, ainda não faturado</span>') +
    card('Processo de alocação', n0(t.aloc) + ' cx', '<span>pedido em alocação de estoque</span>') + card('Pedido do mês', n0(t.fat + t.cart + t.aloc) + ' cx', `<span>${mi(ped)} entre faturado, carteira e alocação</span>`) +
    card('Carteira bloqueada', n0(t.bloq) + ' cx', `<span>remessa ou crédito travado · ${mi(t.nbloq)} fora da conta</span>`) + card('Carteira futura', n0(t.fut) + ' cx', '<span>pedido com data para frente</span>') + '</div>';
  if (arm > 0) h += `<div class="card"><p class="eyebrow">Contra o AR de ${MES_LONGO[M - 1]} (todas as BUs do recorte)</p><h3>${mi(ped)} entre faturado, carteira liberada e alocação: ${p1(ped / arm)} do AR de ${mi(arm)}. <span>Falta ${mi(Math.max(0, arm - ped))} para 100%. A carteira bloqueada fica fora até liberar.</span></h3>
    <div class="barra lg"><i class="pk" style="width:${Math.min(100, ped / arm * 100).toFixed(1)}%"></i></div></div>`;
  const tab = (rot, chave, nomeFn, extraFn, Mp) => {
    const arPor = Mp ? k => { const a = Mp.get(k); return a ? v(a, 2026, M) : NaN; } : null;
    const G = omSoma({...op, chave});
    if (Mp) for (const k of Mp.keys()) if (!G.has(k) && arPor(k) > 0) G.set(k, {...ZERO_OM});   // AR do mês sem pedido entra com zero (lista de cobrança)
    const L = [...G.entries()].map(([k, o]) => ({k, ...o})).sort((a, b) => (b.fat + b.cart + b.aloc) - (a.fat + a.cart + a.aloc));
    const tot = L.reduce((s, x) => { Object.keys(ZERO_OM).forEach(c => { s[c] += x[c]; }); return s; }, {...ZERO_OM});
    const linha = (x, c) => { const ar = arPor && !c ? arPor(x.k) : arPor ? [...Mp.keys()].reduce((s, k) => s + (arPor(k) || 0), 0) : NaN, pd = x.nfat + x.ncart;
      return `<tr class="${c || ''}"><td class="l b">${c ? 'Total' : nomeFn(x.k)}</td>${extraFn ? `<td class="l">${c ? '' : extraFn(x.k)}</td>` : ''}<td>${n0(x.fat)}</td><td>${n0(x.cart)}</td><td>${n0(x.aloc)}</td><td class="b">${n0(x.fat + x.cart + x.aloc)}</td><td>${n0(x.bloq)}</td><td>${n0(x.fut)}</td><td>${n0(x.nfat)}</td><td class="b">${n0(pd)}</td>` +
        (arPor ? `<td>${n0(zeroNaN(ar))}</td><td>${pctMeta(pd / ar)}</td>` : '') + '</tr>'; };
    return `<div class="tw"><table><thead><tr><th class="l">${rot}</th>${extraFn ? '<th class="l"></th>' : ''}<th>Faturado cx</th><th>Carteira cx</th><th>Alocação cx</th><th>Pedido do mês cx</th><th>Bloqueada cx</th><th>Futura cx</th><th>NR faturado</th><th>NR do pedido</th>${arPor ? `<th>AR ${mes(M)}</th><th>% do AR</th>` : ''}</tr></thead><tbody>` +
      (L.map(x => linha(x)).join('') || `<tr><td colspan="12" class="empty">Nada neste recorte.</td></tr>`) + (L.length ? linha(tot, 'tot') : '') + '</tbody></table></div>';
  };
  const arE = cuboP('rs', {...op, chave: r => r[COL.executivo]}), arG = cuboP('rs', {...op, chave: r => r[COL.grp]}), arMk = cuboP('rs', {...op, chave: r => r[COL.marca]});
  h += `<h2 class="sec">Executivo a executivo. <span>Pedido do mês = faturado + carteira liberada + alocação, contra o AR de todas as BUs.</span></h2><div class="card">${tab('Executivo', l => l[1], k => esc(dic.executivo[k]), null, arE)}</div>`;
  h += `<h2 class="sec">Cliente a cliente. <span>Cliente (grupo) do P&L pelo código Plan to.</span></h2><div class="card">${tab('Cliente', l => l[0], k => tit(dic.grp[k]), k => { const d = infoGrp(dic.grp[k]); return d ? esc(d.executivo) : ''; }, arG)}</div>`;
  h += `<h2 class="sec">Marca a marca. <span>Cada marca contra o seu AR do mês.</span></h2><div class="card">${tab('Marca', l => l[4], k => `<span class="${mkCls(dic.marca[k])}">${tit(dic.marca[k])}</span>`, null, arMk)}</div>`;
  h += `<h2 class="sec">Segmento a segmento. <span>Segmento do Order Management levado para a régua do P&L.</span></h2><div class="card">${tab('Segmento', l => l[4] + '|' + l[5], k => { const [m, g] = k.split('|').map(Number); return `${tit(dic.marca[m])} · ${tit(dic.segmento[g])}`; }, null, null)}</div>`;
  h += `<h2 class="sec">Ponto de entrega. <span>Sold to e UF de cada pedido.</span></h2><div class="card">${tab('Sold to', l => l[12] + '|' + l[13] + '|' + l[0], k => { const [s, u] = k.split('|'); return esc(s) + ' · ' + esc(u); }, k => tit(dic.grp[+k.split('|')[2]]), null)}</div>`;
  return h;
}

/* ---------- Exportar para Excel: as tabelas da página aberta, no recorte marcado (sem biblioteca externa) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function deflar(u) {
  if (typeof CompressionStream === 'undefined') return null;
  try { return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch (e) { return null; }
}
async function zipar(arqs) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const [nome, txt] of arqs) {
    const nm = enc.encode(nome), dado = enc.encode(txt), crc = crc32(dado), z = await deflar(dado), met = z ? 8 : 0, corpo = z || dado;
    const lh = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, met, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, corpo.length, 4], [22, dado.length, 4], [26, nm.length, 2], [28, 0, 2]]
      .forEach(([o, x, n]) => (n === 4 ? lh.setUint32(o, x, true) : lh.setUint16(o, x, true)));
    partes.push(new Uint8Array(lh.buffer), nm, corpo);
    const ch = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, met, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, corpo.length, 4], [24, dado.length, 4], [28, nm.length, 2], [42, off, 4]]
      .forEach(([o, x, n]) => (n === 4 ? ch.setUint32(o, x, true) : ch.setUint16(o, x, true)));
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + corpo.length;
  }
  const tamC = central.reduce((s, x) => s + x.length, 0), fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arqs.length, true); fim.setUint16(10, arqs.length, true); fim.setUint32(12, tamC, true); fim.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xesc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const colL = i => { let s = ''; i++; while (i) { const q = (i - 1) % 26; s = String.fromCharCode(65 + q) + s; i = Math.floor((i - 1) / 26); } return s; };
/* estilos: 0 normal · 1 cabeçalho grafite · 2 inteiro · 3 percentual · 4 decimal · 5 título · 6 nota · 7 número sem milhar (ano, ano-mês) */
const XL_EST = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="#,##0.00"/></numFmts>' +
  '<fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="13"/><color rgb="FF1D1D1F"/><name val="Arial"/></font><font><i/><sz val="9"/><color rgb="FF6E6E73"/><name val="Arial"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D1D1F"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function folhaXml(ab) {   // ab = {titulo, nota, cab: [[...]], linhas: [[...]]}; célula = texto | número | {v, s}
  const L = []; let r = 0;
  const cel = (c, i, est) => {
    const ref = colL(i) + r;
    if (c === null || c === undefined || c === '') return '';
    if (typeof c === 'object') return Number.isFinite(c.v) ? `<c r="${ref}" s="${c.s}"><v>${c.v}</v></c>` : '';
    if (typeof c === 'number') return Number.isFinite(c) ? `<c r="${ref}" s="${est || 2}"><v>${c}</v></c>` : '';
    return `<c r="${ref}" t="inlineStr"${est ? ` s="${est}"` : ''}><is><t xml:space="preserve">${xesc(c)}</t></is></c>`;
  };
  const linha = (cs, est) => { r++; L.push(`<row r="${r}">${cs.map((c, i) => cel(c, i, est)).join('')}</row>`); };
  linha([ab.titulo], 5); if (ab.nota) linha([ab.nota], 6); linha([]);
  ab.cab.forEach(c => linha(c, 1)); const fz = r;
  ab.linhas.forEach(c => linha(c));
  const amostra = [...ab.cab, ...ab.linhas.slice(0, 400)], nc = Math.max(1, ...amostra.map(c => c.length));
  const larg = Array.from({length: nc}, (_, i) => Math.min(46, 2 + Math.max(8, ...amostra.map(c => { const x = c[i]; return x === null || x === undefined ? 0 : typeof x === 'string' ? x.length : 12; }))));
  const pane = ab.cab.length ? `<sheetViews><sheetView workbookViewId="0"><pane xSplit="1" ySplit="${fz}" topLeftCell="B${fz + 1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}<cols>${larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${L.join('')}</sheetData></worksheet>`;
}
async function gerarXlsx(abas) {
  const usados = new Set();
  const curtoAba = x => { x = x.replace(/[\[\]:*?\/\\']/g, ' ').replace(/\s+/g, ' ').trim(); if (x.length <= 31 || !x.includes(' · ')) return x;
    const p = x.split(' · '), fim = p.slice(1).join(' · '), r1 = p[0].replace(/\s*\(.*\)\s*$/, '').trim() + ' · ' + fim; return r1.length <= 31 ? r1 : (fim.length <= 31 ? fim : r1); };
  abas.forEach(a => { const n = curtoAba(a.nome || 'Aba').slice(0, 31).trim() || 'Aba'; let k = n, i = 2; while (usados.has(k.toLowerCase())) { const suf = ' ' + i++; k = n.slice(0, 31 - suf.length).trimEnd() + suf; } usados.add(k.toLowerCase()); a.nomeF = k; });
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  return zipar([
    ['[Content_Types].xml', `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${R}"><sheets>${abas.map((a, i) => `<sheet name="${xesc(a.nomeF)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${abas.length + 1}" Type="${R}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', XL_EST],
    ...abas.map((a, i) => [`xl/worksheets/sheet${i + 1}.xml`, folhaXml(a)])]);
}
function numBR(t0) {   // texto da tabela -> número do Excel (pt-BR), mantendo o formato
  const t = t0.replace(/[▲▼●↑↓]/g, '').replace(/\s+/g, ' ').trim(), num = (sg, x) => +(sg + x.replace(/\./g, '').replace(',', '.'));
  let m;
  if ((m = t.match(/^([+-]?)R\$ ?(\d{1,3}(?:\.\d{3})*(?:,\d+)?) Mi$/))) return {v: num(m[1], m[2]) * 1e6, s: 2};
  if ((m = t.match(/^([+-]?)R\$ ?(\d{1,3}(?:\.\d{3})*(?:,\d+)?)$/))) return {v: num(m[1], m[2]), s: m[2].includes(',') ? 4 : 2};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})*(?:,\d+)?)%$/))) return {v: num(m[1], m[2]) / 100, s: 3};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})*(?:,\d+)?) pp$/))) return {v: num(m[1], m[2]), s: 4};
  if ((m = t.match(/^([+-]?)(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?$/))) return {v: num(m[1], m[2] + (m[3] || '')), s: m[3] ? 4 : 2};
  return t;
}
function tabelaParaLinhas(tb) {   // respeita colspan e rowspan; qualificadores (base parcial, plano) vão para a coluna Obs.
  const cab = [], linhas = [], obs = [], ocup = new Set();
  [...tb.querySelectorAll('tr')].forEach((tr, ri) => {
    const out = [], ob = [], eCab = tr.parentElement && tr.parentElement.tagName === 'THEAD'; let c = 0;
    const pula = () => { while (ocup.has(ri + ',' + c)) { out[c] = ''; c++; } };
    for (const td of tr.children) {
      pula();
      const cl = td.cloneNode(true);
      cl.querySelectorAll('div.mini').forEach(d => d.replaceWith(' · ' + d.textContent.trim()));
      cl.querySelectorAll('svg').forEach(d => d.remove());
      const q = [...cl.querySelectorAll('span.mini, small')].map(d => { const x = d.textContent.trim(); d.remove(); return x; }).filter(Boolean);
      const t = cl.textContent.replace(/\s+/g, ' ').trim(), cs = +(td.getAttribute('colspan') || 1), rs = +(td.getAttribute('rowspan') || 1);
      let val = eCab ? t.replace(/ [↑↓]$/, '') : numBR(t);
      if (!eCab && q.length) {
        if (val && typeof val === 'object') { const hd = (cab[cab.length - 1] || [])[c]; ob.push((hd ? hd + ': ' : '') + q.join(', ')); }
        else val = [val, ...q].filter(Boolean).join(' · ');
      }
      out[c] = val;
      for (let k = 1; k < cs; k++) out[c + k] = '';
      for (let q2 = 1; q2 < rs; q2++) for (let k = 0; k < cs; k++) ocup.add((ri + q2) + ',' + (c + k));
      c += cs;
    }
    pula();
    if (eCab) cab.push(out); else { linhas.push(out); obs.push(ob.join('; ')); }
  });
  if (obs.some(Boolean)) {
    const nc = Math.max(0, ...cab.map(x => x.length), ...linhas.map(x => x.length));
    if (cab.length) { const hh = cab[cab.length - 1]; for (let k = hh.length; k < nc; k++) hh[k] = ''; hh[nc] = 'Obs.'; }
    linhas.forEach((x, i) => { for (let k = x.length; k < nc; k++) x[k] = ''; x[nc] = obs[i] || ''; });
  }
  return {cab, linhas};
}
const PAGINAS = {};   // preenchido junto do render
const paginaHTML = () => (PAGINAS[S.page] || (() => comAbasMarca(pgMarca(S.page), S.page)))();
function linhasRecorte() {
  const L = [['Perna', T('Sell Out', 'Sell In')], ['Página', PAGES.find(p => p[0] === S.page)[1]], ['Mês de corte', ehParcial(S.corte, 2026, 'base') ? `${corteRot()}, acumulado de ${corteTxt()}` : `${mes(S.corte)}/26 (acumulado de ${PARC_PG[S.page] ? emFonte(PARC_PG[S.page], corteTxt) : corteTxt()})`]];
  if (notaParcial()) L.push(['Mês parcial', notaParcial()]);
  FILTROS.forEach(([k, n]) => L.push([n, S.f[k].size ? [...S.f[k]].map(i => dic[k][i]).join(', ') : 'Todos']));
  const busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca}[S.page];
  if (busca) L.push(['Busca na tabela', busca]);
  L.push([MODO === 'so' && fontesDaPagina().length ? 'Site publicado em' : 'Base atualizada em', D.gerado]);
  if (MODO === 'so') fontesDaPagina().forEach(f => L.push([`Fonte ${f.nome}`, `${quandoFonte(f)}${f.hora ? ' (extração às ' + f.hora + ')' : ''}${f.obs ? '. ' + f.obs : ''}`]));
  if (MODO === 'si') {
    const bus = S.f.uf.size ? [...S.f.uf].map(i => dic.uf[i]).join(', ') : 'Hygiene, Health e Nutrition';
    L.push(['Order Management', omData()], ['Plano do Q4', S.page === 'si-q4' ? 'AR oficial de 29/09, só Hygiene (base da régua do Q4)' : `AR oficial de 29/09 das BUs do recorte (${bus}); a página Plano Q4 usa só Hygiene`]);
  }
  L.push(['Exportado em', new Date().toLocaleString('pt-BR')], ['Link desta visão', location.href]);
  return L;
}
async function exportarExcel(btn) {
  if (!btn || btn.disabled) return;
  const rot = btn.innerHTML; btn.disabled = true; btn.textContent = 'Gerando…';
  try {
    const ui0 = JSON.stringify(S.ui); S.ui.sctodas = 1; S.ui.cltodas = 1;   // listas de redes completas no Excel
    const div = document.createElement('div');
    try { div.innerHTML = paginaHTML(); } finally { Object.keys(S.ui).forEach(k => delete S.ui[k]); Object.assign(S.ui, JSON.parse(ui0)); }
    const nomePg = PAGES.find(p => p[0] === S.page)[1], busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca}[S.page];
    const resumo = [...FILTROS.filter(([k]) => S.f[k].size).map(([k, n]) => `${n}: ${[...S.f[k]].map(i => dic[k][i]).join(', ')}`), ...(busca ? [`Busca: ${busca}`] : [])].join(' · ') || 'Sem recorte';
    const nota = `${T('Sell Out', 'Sell In')} · ${nomePg} · corte ${corteRot()} · ${resumo}`;
    const abas = [{nome: 'Recorte', titulo: `Governança CTO · ${T('Sell Out', 'Sell In')} · ${nomePg}`, nota: 'Recorte marcado no site no momento da exportação.', cab: [['Item', 'Valor']], linhas: linhasRecorte()}];
    if (S.page === 'base' || S.page === 'si-base') {
      const B = linhasBase();
      abas.push({nome: 'Base do recorte', titulo: 'Base do recorte', nota, cab: [CAB()], linhas: B.map(r => celulas(r).map((x, i) => (i < 2 ? {v: x, s: 7} : typeof x === 'number' ? {v: x, s: i === 15 ? 2 : 4} : x)))});
    } else {
      let h2 = nomePg, h2sub = '';
      div.querySelectorAll('h2.sec, table').forEach(el => {
        if (el.tagName === 'H2') { const sp = el.querySelector('span'); h2sub = sp ? sp.textContent.trim() : ''; h2 = el.textContent.replace(h2sub, '').trim().replace(/\.$/, '') || nomePg; return; }
        const card = el.closest('.card');   // o rótulo da tabela é o último eyebrow do card que vem ANTES dela
        const ebs = card ? [...card.querySelectorAll('.eyebrow')].filter(e => e.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) : [];
        const eb = ebs[ebs.length - 1], te = eb ? eb.textContent.trim() : '';
        const nome = te && !/^\d+$/.test(te) ? te : h2;
        const {cab, linhas} = tabelaParaLinhas(el);
        const nx = el.closest('[data-xls-nota]');   // tabela com recorte próprio (share por UF: Reckitt inteira, sem os filtros do site)
        if (linhas.length) abas.push({nome, titulo: nome, nota: nx ? nx.getAttribute('data-xls-nota') : h2sub ? `${nota} · ${h2sub}` : nota, cab, linhas});
      });
    }
    if (abas.length === 1) abas[0].linhas.push(['Observação', 'Esta página não tem tabela; o recorte segue registrado acima.']);
    const blob = await gerarXlsx(abas);
    const a = document.createElement('a'), d0 = new Date(), data = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
    a.href = URL.createObjectURL(blob); a.download = `Governanca_CTO_${T('SellOut', 'SellIn')}_${semAcento(nomePg).replace(/[^a-z0-9]+/g, '_')}_${data}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = 'Excel baixado';
  } catch (e) { btn.textContent = 'Não deu para gerar'; console.error(e); }
  setTimeout(() => { btn.disabled = false; btn.innerHTML = rot; }, 2200);
}

/* ---------- Modo Apresentação e PDF: a página aberta vira slides 16:9 (1280 x 720), no recorte marcado ---------- */
const SW = 1280, SH = 720, S_MAX_LINHAS = 18, SECOES_FORA = /^(O índice|Como usar|Como ler)/;
const tiraInstrucao = t => t.replace(/(^|\.\s+)(Clique|Escolha|Ordene|Marque|Arraste)[^.]*\.?/g, '$1').trim();   // frase de instrução de tela não vai para o slide
function limparParaSlide(el) {   // tira o que é de clicar e corta tabela longa (a lista completa sai no Excel)
  if (el.matches('.seg, .pills, .pager, .csvbox, input, select, textarea, button.btn, .termo:empty')) return null;
  if (el.matches('p.note') && el.children.length && [...el.childNodes].every(n => (n.nodeType === 3 && !n.textContent.trim()) || n.tagName === 'A' || n.textContent.trim().length < 3)) return null;   // nota que só tem link
  const caixa = document.createElement('div'); caixa.appendChild(el);   // assim as buscas abaixo também pegam o próprio bloco
  caixa.querySelectorAll('.seg, .pills, input, textarea, select, .pager, button.btn, .csvbox').forEach(x => x.remove());
  caixa.querySelectorAll('[data-act]').forEach(x => x.removeAttribute('data-act'));
  caixa.querySelectorAll('a').forEach(a => { const sp = document.createElement('span'); sp.className = a.className; sp.setAttribute('style', a.getAttribute('style') || ''); sp.innerHTML = a.innerHTML; a.replaceWith(sp); });
  caixa.querySelectorAll('button').forEach(b => { const sp = document.createElement('span'); sp.className = b.className; sp.setAttribute('style', b.getAttribute('style') || ''); sp.innerHTML = b.innerHTML; b.replaceWith(sp); });
  caixa.querySelectorAll('tbody').forEach(tb => {
    const corpo = [...tb.rows].filter(x => !x.classList.contains('tot') && !x.classList.contains('sub'));
    if (corpo.length > S_MAX_LINHAS) {
      corpo.slice(S_MAX_LINHAS).forEach(x => x.remove());
      const tw = tb.closest('.tw') || tb.closest('table'), n = document.createElement('p');
      n.className = 'note s-corte'; n.textContent = `Mostrando ${S_MAX_LINHAS} de ${corpo.length} linhas, na ordem da tela. A lista completa sai no Excel.`; tw.after(n);
    }
  });
  caixa.querySelectorAll('table').forEach(tb => {   // tabela larga demais (ex.: 24 meses): fica a 1ª coluna e as 15 mais recentes
    const linhas = [...tb.rows], nc = Math.max(...linhas.map(x => x.cells.length));
    if (nc <= 16 || tb.querySelector('[colspan], [rowspan]')) return;
    linhas.forEach(x => { [...x.cells].slice(1, nc - 15).forEach(c => c.remove()); });
    const n = document.createElement('p'); n.className = 'note s-corte'; n.textContent = `Mostrando as ${15} colunas mais recentes de ${nc - 1}. A tabela completa sai no Excel.`;
    (tb.closest('.tw') || tb).after(n);
  });
  caixa.querySelectorAll('.shelf').forEach(sh => { [...sh.children].slice(8).forEach(c => c.remove()); });
  return caixa.firstElementChild;
}
function gruposDaPagina() {
  const div = document.createElement('div'); div.innerHTML = paginaHTML();
  const nos = []; const plano = el => { [...el.children].forEach(c => { if (c.classList.contains('det') && c.querySelector(':scope > h2.sec')) plano(c); else nos.push(c); }); };
  plano(div);
  let capa = null; const grupos = []; let atual = {titulo: '', sub: '', nos: []};
  nos.forEach(el => {
    if (el.matches('section.hero')) { capa = el; return; }
    if (el.matches('h2.sec')) {
      if (atual.nos.length) grupos.push(atual);
      const sp = el.querySelector('span'), sub = sp ? sp.textContent.trim() : '';
      atual = {titulo: el.textContent.replace(sub, '').trim().replace(/\.$/, ''), sub: tiraInstrucao(sub), nos: []}; return;
    }
    atual.nos.push(el);
  });
  if (atual.nos.length) grupos.push(atual);
  return {capa, grupos: grupos.filter(g => !SECOES_FORA.test(g.titulo))};
}
function recorteSlide() {   // o resumo já sai escapado (tit); soma a busca digitada na tabela, como no Excel
  const busca = {'redes-scan': S.ui.scbusca, 'redes-col': S.ui.clbusca, confronto: S.ui.cbusca}[S.page];
  return [recorteResumo(), busca ? 'Busca: ' + esc(busca) : ''].filter(Boolean).join(' · ') || 'Visão completa da regional, sem filtro';
}
function moldeSlide(nomePg, titulo, sub) {
  const s = document.createElement('div'); s.className = 'slide';
  s.innerHTML = `<div class="s-top"><img src="assets/reckitt_logo.png" alt="Reckitt"><b>Governança CTO</b><span>${T('Sell Out', 'Sell In')} · ${esc(nomePg)}</span><span class="s-rec">${recorteSlide()} · corte ${esc(corteRot())}</span></div>
    ${titulo ? `<div class="s-tit"><h2>${esc(titulo)}. <span>${esc(sub)}</span></h2></div>` : ''}<div class="s-corpo"><div class="s-escala"></div></div>
    <div class="s-pe"><span>${MODO === 'so' && fontesDaPagina().length ? esc(fontesDaPagina().filter(f => !f.congelada).map(f => `${f.nome} ${quandoFonte(f, true)}`).join(' · ')) : `Atualizado em ${esc(D.gerado.split(' ')[0])}`}${MODO === 'si' && D.om ? ` · pedidos de ${omData()}` : ''} · uso interno</span><span class="s-num"></span></div>`;
  return s;
}
function encaixar(s) {   // mede, aplica a escala e mede de novo (gráfico e tabela mudam de altura quando a largura muda)
  const corpo = s.querySelector('.s-corpo'), es = s.querySelector('.s-escala'), W = corpo.clientWidth, H = corpo.clientHeight;
  es.style.transform = ''; es.style.width = W + 'px';
  let k = Math.min(1, H / Math.max(1, es.scrollHeight), W / Math.max(1, es.scrollWidth));
  for (let i = 0; i < 4 && k < 1; i++) {
    es.style.width = (W / k) + 'px';
    const k2 = Math.min(H / Math.max(1, es.scrollHeight), (W / k) / Math.max(1, es.scrollWidth) * k);
    if (k2 >= k - 0.002) break; k = k2;
  }
  es.style.transform = k < 1 ? `scale(${k})` : ''; if (k >= 1) es.style.width = W + 'px';
  return k;
}
const altura = s => s.querySelector('.s-escala').scrollHeight, cabe = s => altura(s) <= s.querySelector('.s-corpo').clientHeight;
function montarSlides() {
  const caixa = document.getElementById('impressao'); caixa.innerHTML = '';
  SLIDE = true;
  let capa, grupos;
  try { ({capa, grupos} = gruposDaPagina()); } finally { SLIDE = false; }
  const nomePg = PAGES.find(p => p[0] === S.page)[1], slides = [];
  // capa: o título da página, o recorte e o primeiro bloco (os números do topo)
  const sc = moldeSlide(nomePg, '', ''); sc.classList.add('capa');
  const h1 = capa ? capa.querySelector('h1') : null;
  sc.querySelector('.s-escala').innerHTML = `<p class="eyebrow">${esc(T('Sell Out', 'Sell In'))} · ${esc(nomePg)}</p><h1 class="s-h1">${h1 ? h1.innerHTML : esc(nomePg)}</h1>
    <p class="s-sub">${recorteSlide()} · acumulado de jan a ${esc(corteRot())}</p>`;
  const su = capa ? capa.querySelector('.shareuf') : null;   // market share por UF (Redes Scanntech): fica no título, então vai para a capa; a tabela escondida é só do Excel
  if (su) { su.querySelectorAll('.su-xls').forEach(x => x.remove()); const b = limparParaSlide(su); if (b) sc.querySelector('.s-escala').appendChild(b); }
  const prim = grupos.length && !grupos[0].titulo ? grupos.shift() : null;
  if (prim) prim.nos.forEach(n => { const b = limparParaSlide(n); if (b) sc.querySelector('.s-escala').appendChild(b); });
  caixa.appendChild(sc); slides.push(sc); encaixar(sc);
  let s = null;
  grupos.forEach(g => {
    const blocos = g.nos.map(limparParaSlide).filter(Boolean); if (!blocos.length) return;
    // seção pequena entra no slide anterior, se couber sem encolher
    if (s && s !== sc) {
      const alvo = s.querySelector('.s-escala'), h3 = document.createElement('h3'); h3.className = 's-subtit'; h3.innerHTML = `${esc(g.titulo)}. <span>${esc(g.sub)}</span>`;
      alvo.style.transform = ''; alvo.style.width = s.querySelector('.s-corpo').clientWidth + 'px';
      alvo.appendChild(h3); blocos.forEach(b => alvo.appendChild(b));
      if (cabe(s)) { encaixar(s); return; }
      h3.remove(); blocos.forEach(b => b.remove()); encaixar(s);
    }
    s = moldeSlide(nomePg, g.titulo || nomePg, g.sub); caixa.appendChild(s); slides.push(s);
    blocos.forEach(bloco => {
      const alvo = s.querySelector('.s-escala'); alvo.appendChild(bloco);
      if (alvo.children.length > 1 && altura(s) > s.querySelector('.s-corpo').clientHeight * 1.15) {   // não coube: slide de continuação
        bloco.remove(); encaixar(s);
        s = moldeSlide(nomePg, g.titulo + ' (continuação)', g.sub); caixa.appendChild(s); slides.push(s); s.querySelector('.s-escala').appendChild(bloco);
      }
    });
    encaixar(s);
  });
  slides.forEach((x, i) => { x.querySelector('.s-num').textContent = `${i + 1}/${slides.length}`; });
  return slides;
}
let APRES = null;
function abrirApresentacao() {
  fecharPop();
  const slides = montarSlides(), box = document.getElementById('apres');
  box.innerHTML = `<div class="ap-palco"></div><div class="ap-ctl"><button data-ap="ant" aria-label="Slide anterior">‹</button><span class="ap-n"></span><button data-ap="prox" aria-label="Próximo slide">›</button>
    <button data-ap="pdf">⤓ PDF</button><button data-ap="sair">Sair (Esc)</button></div>`;
  const palco = box.querySelector('.ap-palco'); slides.forEach(s => palco.appendChild(s));
  box.hidden = false; document.body.classList.add('apresentando');
  APRES = {i: 0, slides};
  try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* sem tela cheia */ }
  mostrarSlide(0);
}
function mostrarSlide(i) {
  if (!APRES) return;
  const n = APRES.slides.length; APRES.i = Math.max(0, Math.min(n - 1, i));
  const k = Math.min(innerWidth / SW, (innerHeight - 56) / SH);
  APRES.slides.forEach((s, j) => { s.style.display = j === APRES.i ? '' : 'none'; s.style.transform = `scale(${k})`; });
  document.querySelector('#apres .ap-n').textContent = `${APRES.i + 1} de ${n}`;
}
function fecharApresentacao(manter) {
  const box = document.getElementById('apres'); box.hidden = true; if (!manter) box.innerHTML = ''; APRES = null; document.body.classList.remove('apresentando');
  if (!manter) document.getElementById('impressao').innerHTML = '';
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* já saiu */ }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ap]'); if (!b) { if (APRES && e.target.closest('.ap-palco')) mostrarSlide(APRES.i + 1); return; }
  const a = b.dataset.ap;
  if (a === 'ant') mostrarSlide(APRES.i - 1); else if (a === 'prox') mostrarSlide(APRES.i + 1);
  else if (a === 'sair') fecharApresentacao(); else if (a === 'pdf') { const prontos = APRES.slides; fecharApresentacao(true); gerarPDF(null, prontos); }
});
document.addEventListener('keydown', e => {
  if (!APRES) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); mostrarSlide(APRES.i + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); mostrarSlide(APRES.i - 1); }
  else if (e.key === 'Escape') fecharApresentacao();
});
document.addEventListener('fullscreenchange', () => { if (APRES && !document.fullscreenElement) mostrarSlide(APRES.i); });
addEventListener('resize', () => { if (APRES) mostrarSlide(APRES.i); });
function gerarPDF(btn, prontos) {
  fecharPop();
  let slides;
  if (prontos) {   // PDF de dentro da apresentação: imprime os mesmos slides que estavam na tela
    const caixa = document.getElementById('impressao'); caixa.innerHTML = '';
    prontos.forEach(x => { x.style.display = ''; x.style.transform = ''; caixa.appendChild(x); }); slides = prontos;
    document.getElementById('apres').innerHTML = '';
  } else slides = montarSlides();
  const titulo0 = document.title, d0 = new Date(), nomePg = PAGES.find(p => p[0] === S.page)[1];
  const rc = FILTROS.filter(([k]) => S.f[k].size).map(([k]) => [...S.f[k]].map(i => dic[k][i]).join('+')).join(' · ').replace(/[\/:*?"<>|]/g, '').slice(0, 60);
  document.title = `Governança CTO · ${T('Sell Out', 'Sell In')} · ${nomePg}${rc ? ' · ' + rc : ''} · ${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
  const css = document.createElement('style'); css.id = 'estilo-pdf'; css.textContent = '@page { size: 13.333in 7.5in; margin: 0; }';
  document.head.appendChild(css); document.body.classList.add('imprimindo');
  let feito = false;
  const fim = () => { if (feito) return; feito = true; document.body.classList.remove('imprimindo'); css.remove(); document.title = titulo0; document.getElementById('impressao').innerHTML = ''; removeEventListener('afterprint', fim); };
  addEventListener('afterprint', fim);
  if (btn) { const r0 = btn.innerHTML; btn.textContent = `${slides.length} slides: escolha "Salvar como PDF"`; setTimeout(() => { btn.innerHTML = r0; }, 6000); }
  const imgs = [...document.querySelectorAll('#impressao img')].map(im => (im.complete ? Promise.resolve() : new Promise(ok => { im.onload = im.onerror = ok; })));
  Promise.all(imgs).then(() => setTimeout(() => { window.print(); setTimeout(fim, 1500); }, 60));
}

const rod = document.getElementById('rodape');
function render(topo = true) {
  nav();
  const y = scrollY;
  const lados = [...document.querySelectorAll('#app .shelf, #app .tw')].map(x => x.scrollLeft);
  const app = document.getElementById('app');
  app.innerHTML = paginaHTML();
  document.title = (S.page === 'inicio' || S.page === 'si-inicio' ? '' : PAGES.find(p => p[0] === S.page)[1] + ' · ') + 'Governança CTO · ' + T('Sell Out', 'Sell In');
  if (rod) rod.innerHTML = (D.rodape || []).map(t => `<p>${esc(t)}</p>`).join('');
  ['scbusca', 'clbusca'].forEach(idb => {   // busca das redes: redesenha só a tabela
    const inp = document.getElementById(idb); if (!inp) return;
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui[idb] = inp.value; const box = document.getElementById('rd-tab'); if (box && RD_ULT) box.innerHTML = emFonte(RD_ULT.fr || null, () => (RD_ULT.tipo === 'sc' ? tabelaScan(RD_ULT.itens) : tabelaCol(RD_ULT.itens))); }, 150); };
    inp.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    inp.addEventListener('compositionend', aplica);
  });
  const cb = document.getElementById('cbusca');
  if (cb) {
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui.cbusca = cb.value; document.getElementById('conf-res').innerHTML = confRes(); }, 150); };
    cb.addEventListener('input', e => { if (!e.isComposing) aplica(); });
    cb.addEventListener('compositionend', aplica);
  }
  if (!topo) {
    scrollTo({top: y});
    const novos = document.querySelectorAll('#app .shelf, #app .tw');
    if (novos.length === lados.length) novos.forEach((x, i) => { x.scrollLeft = lados[i]; });
  }
}

Object.assign(PAGINAS, {inicio: pgInicio, geral: () => comAbasMarca(pgGeral(), 'geral'), hn: () => comAbasMarca(pgHN(), S.page), diretor: pgDiretor, clientes: pgSoClientes, executivos: pgSoExec,
  'redes-scan': () => comAbas(pgRedesScan(), 'redes-scan'), 'redes-col': () => comAbas(pgRedesCol(), 'redes-col'), confronto: pgConfronto, depara: pgDepara, base: pgBase,
  'si-inicio': pgSiInicio, 'si-geral': () => comAbasMarca(pgSiGeral(), 'si-geral'), 'si-hn': () => comAbasMarca(pgHN(), 'si-hn'), 'si-diretor': pgDiretor, 'si-clientes': pgSiClientes, 'si-exec': pgSiExec, 'si-q4': pgSiQ4, 'si-mes': pgSiMes, 'si-rv': pgSiRV, 'si-base': pgBase});
lerHash(); filtrar(); gravarHash(); fbar(); render();   // o endereço passa a mostrar só o recorte que foi aplicado
})();
