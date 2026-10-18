/* Dash Geral CTO · site. Mesma lógica do DASH_GERAL_CTO_POWERQUERY.xlsx:
   R$ e caixas somam o nível SEGMENTO; PDV vem do TOTAL, da MARCA ou do SEGMENTO conforme o recorte (sem soma dupla no total). */
(() => {
const D = window.DASH;
const COL = {recorte:2, uf:3, grp:4, executivo:5, canal:6, fonte:7, janela:8, nivel:9, marca:10, segmento:11};
const RS = 12, CX = 13, PDV = 14, ANO0 = 2023;
const ANOS = [2023, 2024, 2025, 2026];
const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const mes = k => MESES[k-1].toLowerCase();
const dic = D.dic, id = (c, v) => dic[c].indexOf(v);
const NIV = {TOTAL: id('nivel','TOTAL'), MARCA: id('nivel','MARCA'), SEG: id('nivel','SEGMENTO')};
const TODAS = id('marca','(TODAS AS MARCAS)'), TODOS = id('segmento','(TODOS OS SEGMENTOS)');
const MED = {rs: {col: RS, nome: 'Sell out R$', curto: 'R$', media: false},
             cx: {col: CX, nome: 'Caixas', curto: 'Caixas', media: false},
             pdv: {col: PDV, nome: 'PDVs positivados', curto: 'PDVs', media: true}};
const FILTROS = [['recorte','Recorte'],['uf','UF'],['grp','Grp. Econômico'],['executivo','Executivo de Vendas'],['canal','Canal'],
                 ['fonte','Fonte'],['janela','Comparabilidade'],['marca','Marca'],['segmento','Segmento']];
const PAGES = [
  ['inicio','Início'], ['geral','Dados gerais'], ['veja','Veja'], ['vanish','Vanish'], ['harpic','Harpic'], ['finish','Finish'],
  ['hn','H&N'], ['diretor','Visão do Diretor'], ['redes-scan','Redes Scanntech'], ['redes-col','Redes Colecta'], ['confronto','Confronto de fontes'], ['depara','De-para'], ['base','Base geral']];
const MARCA_PAG = {veja: ['VEJA'], vanish: ['VANISH'], harpic: ['HARPIC'], finish: ['FINISH']};
const HN = [['SUSTAGEN', ['SUSTAGEN']], ['BEM ESTAR SEXUAL (JONTEX + OLLA)', ['JONTEX','OLLA']], ['VEET', ['VEET']]];

/* ---------- estado ----------
   Site (GitHub): o recorte fica no endereço da página, então o link já abre filtrado.
   Link do claude.ai (window.DASH_ARTIFACT): o endereço só aceita a página (#veja); o recorte fica lembrado neste navegador. */
const ART = !!window.DASH_ARTIFACT, CHAVE = 'dash-geral-cto';
const S = {page: 'inicio', f: {}, corte: D.corte, ui: {}};
FILTROS.forEach(([k]) => S.f[k] = new Set());
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
  let bruto = '';
  try { bruto = decodeURIComponent(location.hash.slice(1)); } catch (e) { bruto = ''; try { history.replaceState(null, '', location.pathname); } catch (x) { /* sem histórico */ } }
  const [pg, ...qs] = bruto.split('&');
  S.page = PAGES.some(p => p[0] === pg) ? pg : 'inicio';
  FILTROS.forEach(([k]) => S.f[k] = new Set());
  S.corte = D.corte;
  qs.forEach(q => {
    const [k, v] = q.split('=');
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
}

/* ---------- motor de cálculo ---------- */
let BASE = [];
function filtrar() {
  const ativos = FILTROS.filter(([k]) => k !== 'marca' && k !== 'segmento' && S.f[k].size).map(([k]) => [COL[k], S.f[k]]);
  BASE = D.rows.filter(r => ativos.every(([c, s]) => s.has(r[c])));
}
const setOuNull = s => (s && s.size ? s : null);
const gMarcas = () => setOuNull(S.f.marca);
const gSegs = () => setOuNull(S.f.segmento);
const marcasDe = nomes => new Set(nomes.map(n => id('marca', n)).filter(i => i >= 0));
/* devolve Map chave -> Float64Array(48) [ano x mês], NaN = sem dado */
function cubo(med, {marcas = null, segs = null, chave = null, porMarca = false, rows = BASE} = {}) {
  const col = MED[med].col;
  const nivel = med !== 'pdv' ? NIV.SEG : (segs ? NIV.SEG : ((marcas || porMarca) ? NIV.MARCA : NIV.TOTAL));
  const out = new Map();
  for (const r of rows) {
    if (r[COL.nivel] !== nivel) continue;
    if (marcas && !marcas.has(r[COL.marca])) continue;
    if (segs && !segs.has(r[COL.segmento])) continue;
    const k = chave ? chave(r) : '_';
    let a = out.get(k); if (!a) { a = new Float64Array(48).fill(NaN); out.set(k, a); }
    const i = (r[0] - ANO0) * 12 + r[1] - 1;
    a[i] = (isNaN(a[i]) ? 0 : a[i]) + r[col];
  }
  for (const a of out.values()) for (let m = S.corte; m < 12; m++) a[36 + m] = NaN;   // 2026 só até o corte
  return out;
}
const um = (med, o) => cubo(med, o).get('_') || new Float64Array(48).fill(NaN);
const v = (a, ano, m) => a[(ano - ANO0) * 12 + m - 1];
function agg(a, ano, meses, media) {
  let s = 0, n = 0;
  for (const m of meses) { const x = v(a, ano, m); if (!isNaN(x)) { s += x; n++; } }
  return n ? (media ? s / n : s) : NaN;
}
const ate = n => Array.from({length: n}, (_, i) => i + 1);
const ytd = (a, ano, med) => agg(a, ano, ate(S.corte), MED[med].media);
const ano = (a, y, med) => agg(a, y, ate(12), MED[med].media);
const varr = (n, d) => (isFinite(n) && isFinite(d) && d !== 0 ? n / d - 1 : NaN);

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
const vbig = x => (isFinite(x) ? `<span class="vbig ${cls(x) || 'flat'}">${x > 0.0005 ? '▲' : x < -0.0005 ? '▼' : '●'} ${pc(x)}</span>` : '');   // destaque nos cards e títulos
const fmtMed = (med, x) => (med === 'rs' ? mi(x) : isFinite(x) ? nf0.format(x) : 'sem dado');
const semAcento = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tit = s => esc(s).toLowerCase().replace(/(^|[\s(+.-])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bDf\b|\bGo\b|\bMs\b|\bMt\b|\bTo\b|\bPa\b|\bJc\b|\bDac\b|\bSto\b|\bVmu\b|\bVlp\b|\bVps\b|\bA\.s\.e\b/g, x => x.toUpperCase());
const mkCls = m => (m === 'VEJA' ? 'mk-veja' : m === 'VANISH' ? 'mk-vanish' : '');
const corteTxt = () => `jan a ${mes(S.corte)}`;

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

function larguraCard() {
  const app = document.getElementById('app'), w = app ? app.clientWidth : 1000;
  return w - (innerWidth < 640 ? 80 : 100);   // padding do main + padding do card
}
function chart(a, med, alto = 250, larg = null, rotulos = true, opc = {}) {
  const W = Math.round(Math.max(240, Math.min(1180, larg || larguraCard()))), H = alto, pt = 26, gw = W / 12, bw = gw * 0.3;
  const comValor = rotulos && gw >= 46, comVar = rotulos && !opc.semVar && gw >= 50;
  const pb = comVar ? 50 : 28;
  let mx = 0; for (let m = 1; m <= 12; m++) for (const y of [2025, 2026]) { const x = v(a, y, m); if (x > mx) mx = x; }
  if (!mx) return '<div class="empty">Sem dado para este recorte.</div>';
  const h = x => (isFinite(x) && x > 0 ? (x / mx) * (H - pt - pb) : 0);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MED[med].nome} 2025 e 2026 por mês">`;
  for (let m = 1; m <= 12; m++) {
    const x0 = (m - 1) * gw + gw / 2, a25 = v(a, 2025, m), a26 = v(a, 2026, m), h25 = h(a25), h26 = h(a26);
    s += `<rect x="${x0 - bw - 2}" y="${H - pb - h25}" width="${bw}" height="${h25}" rx="4" fill="#D2D2D7"/>`;
    if (h26) s += `<rect x="${x0 + 2}" y="${H - pb - h26}" width="${bw}" height="${h26}" rx="4" fill="#FF007F"/>`;
    if (h26 && comValor) s += `<text class="vl" x="${x0 + 2 + bw / 2}" y="${H - pb - h26 - 7}" text-anchor="middle" font-size="12" font-weight="600" fill="#1D1D1F">${curto(a26)}</text>`;
    s += `<text x="${x0}" y="${H - (comVar ? 30 : 8)}" text-anchor="middle" font-size="11" fill="#6E6E73">${gw >= 34 ? MESES[m - 1] : MESES[m - 1][0]}</text>`;
    const vm = (opc.fv || varr)(a26, a25);
    if (comVar && isFinite(vm)) s += `<text x="${x0}" y="${H - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${vm > 0.0005 ? '#1D7A34' : vm < -0.0005 ? '#D70015' : '#6E6E73'}">${pc(vm)}</text>`;
    const vt = opc.semVar ? NaN : (opc.fv || varr)(a26, a25);
    const t = `<b>${MESES[m - 1]}</b> · 2025: ${med === 'rs' ? 'R$ ' : ''}${n0(a25) || 'sem dado'} · 2026: ${med === 'rs' ? 'R$ ' : ''}${n0(a26) || 'sem dado'} ${isFinite(vt) ? '· ' + pc(vt) : ''}`;
    s += `<rect x="${(m - 1) * gw}" y="0" width="${gw}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`;
  }
  return s + '</svg><div class="legend"><span><i style="background:#D2D2D7"></i>2025</span><span><i style="background:#FF007F"></i>2026 até ' + mes(S.corte) + '</span></div>';
}

function tabelaMensal(a, med) {
  const media = MED[med].media;
  let h = '<div class="tw"><table><thead><tr><th>Mês</th>' + ANOS.map(y => `<th>${y}</th>`).join('') +
          '<th>24 vs 23</th><th>25 vs 24</th><th>26 vs 25</th><th>Tri 26 vs 25</th></tr></thead><tbody>';
  for (let m = 1; m <= 12; m++) {
    h += `<tr><td class="b">${MESES[m - 1]}</td>` + ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(a, y, m))}</td>`).join('');
    for (let j = 0; j < 3; j++) h += `<td>${vc(varr(v(a, ANOS[j + 1], m), v(a, ANOS[j], m)))}</td>`;
    if (m % 3 === 1) {
      const ms = [m, m + 1, m + 2].filter(x => x <= S.corte && isFinite(v(a, 2026, x)));
      const q = ms.length ? varr(agg(a, 2026, ms, media), agg(a, 2025, ms, media)) : NaN;
      h += `<td class="q" rowspan="3">${vc(q)}</td>`;
    }
    h += '</tr>';
  }
  const y = ANOS.map(x => ytd(a, x, med)), t = ANOS.map(x => ano(a, x, med));
  h += `<tr class="tot"><td>${media ? 'Média' : 'Total'} ${corteTxt()}</td>` + y.map(x => `<td>${n0(x)}</td>`).join('') +
       [0, 1, 2].map(j => `<td>${vc(varr(y[j + 1], y[j]))}</td>`).join('') + `<td>${vc(varr(y[3], y[2]))}</td></tr>`;
  h += `<tr class="sub"><td>${media ? 'Média' : 'Total'} do ano</td>` + t.map(x => `<td>${n0(x)}</td>`).join('') +
       [0, 1].map(j => `<td>${vc(varr(t[j + 1], t[j]))}</td>`).join('') + '<td></td><td></td></tr>';
  return h + '</tbody></table></div>';
}

/* bloco com controle R$ · Caixas · PDVs (os três blocos do Power Query num card só) */
const BLOCOS = {};
function bloco(bid, rotulo, opts) {
  BLOCOS[bid] = {rotulo, opts};
  return `<div class="card" id="b-${bid}">${blocoIn(bid)}</div>`;
}
function blocoIn(bid) {
  const {rotulo, opts} = BLOCOS[bid], med = S.ui['m' + bid] || 'rs';
  const a = um(med, opts), y26 = ytd(a, 2026, med), y25 = ytd(a, 2025, med), d = varr(y26, y25);
  const frase = med === 'pdv' ? `${n0(y26)} PDVs por mês.` : med === 'rs' ? `${mi(y26)} até ${mes(S.corte)}.` : `${n0(y26)} caixas até ${mes(S.corte)}.`;
  const resto = isFinite(d) ? ` ${vbig(d)} <span>sobre 2025${med === 'pdv' ? ', na média mensal' : ''}.</span>` : ' <span>Sem base de 2025 para comparar.</span>';
  return `<p class="eyebrow">${esc(rotulo)} · ${MED[med].nome}</p><h3>${frase}${resto}</h3>
    <div class="seg" data-bid="${bid}">${Object.keys(MED).map(k => `<button data-act="med" data-bid="${bid}" data-m="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>
    ${chart(a, med)}${tabelaMensal(a, med)}`;
}

function kpis(opts, extra = true) {
  const r = um('rs', opts), c = um('cx', opts), p = um('pdv', opts);
  const card = (lab, val, d, sub) => `<div class="card kpi"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub dv">${vbig(d)}<span>${sub}</span></div></div>`;
  const r26 = ytd(r, 2026, 'rs'), r25 = ytd(r, 2025, 'rs'), p26 = ytd(p, 2026, 'pdv'), p25 = ytd(p, 2025, 'pdv');
  let h = card('Sell out ' + corteTxt(), mi(r26), varr(r26, r25), `sobre ${mi(r25)} em 2025`) +
          card('Caixas ' + corteTxt(), n0(ytd(c, 2026, 'cx')), varr(ytd(c, 2026, 'cx'), ytd(c, 2025, 'cx')), 'sobre 2025') +
          card('PDVs positivados', n0(p26), varr(p26, p25), `média por mês, contra ${n0(p25)}`);
  if (extra) {
    const t26 = r26 / agg(p, 2026, ate(S.corte), false), t25 = r25 / agg(p, 2025, ate(S.corte), false);   // R$ por PDV-mês, mesmos meses
    h += card('Ticket por PDV', 'R$ ' + n0(t26), varr(t26, t25), `por mês, contra R$ ${n0(t25)}`);
  }
  return `<div class="grid ${extra ? 'g4' : 'g3'}">${h}</div>`;
}

/* tabela YTD por chave (marca, UF, distribuidor) */
function tabelaYTD(rotulo, itens, chaveFn, opts, porMarca = false) {
  const R = cubo('rs', {...opts, chave: chaveFn}), P = cubo('pdv', {...opts, chave: chaveFn, porMarca});
  const linhas = itens.map(([k, nome, extra]) => {
    const a = R.get(k), p = P.get(k);
    const y = ANOS.map(x => (a ? agg(a, x, ate(S.corte), false) : NaN));
    const pp = [2025, 2026].map(x => (p ? agg(p, x, ate(S.corte), true) : NaN));   // média dos meses com dado, igual ao card
    return {nome, extra, y, pp};
  }).filter(l => l.y.some(isFinite));
  const tot = ANOS.map((_, j) => linhas.reduce((s, l) => s + (isFinite(l.y[j]) ? l.y[j] : 0), 0));
  const PT = um('pdv', opts), tp = [ytd(PT, 2025, 'pdv'), ytd(PT, 2026, 'pdv')];   // total do recorte, igual ao card
  linhas.sort((a, b) => (b.y[3] || 0) - (a.y[3] || 0));
  const row = (l, c) => `<tr class="${c || ''}"><td class="l">${l.nome}</td>${l.extra !== undefined ? `<td class="l">${l.extra}</td>` : ''}` +
    l.y.map((x, j) => `<td class="${j === 3 ? 'b' : ''}">${n0(x)}</td>`).join('') +
    [0, 1, 2].map(j => `<td>${vc(varr(l.y[j + 1], l.y[j]))}</td>`).join('') + `<td>${p1(l.y[3] / tot[3])}</td>` +
    `<td>${n0(l.pp[0])}</td><td class="b">${n0(l.pp[1])}</td><td>${vc(varr(l.pp[1], l.pp[0]))}</td></tr>`;
  const temExtra = itens.length && itens[0][2] !== undefined;
  return `<div class="tw"><table><thead><tr><th class="l">${rotulo}</th>${temExtra ? '<th class="l">UF</th>' : ''}${ANOS.map(y => `<th>R$ ${y}</th>`).join('')}
    <th>24 vs 23</th><th>25 vs 24</th><th>26 vs 25</th><th>Peso 26</th><th>PDVs 25</th><th>PDVs 26</th><th>Var.</th></tr></thead><tbody>
    ${linhas.map(l => row(l)).join('')}${row({nome: 'Total', extra: temExtra ? '' : undefined, y: tot, pp: tp}, 'tot')}</tbody></table></div>`;
}

/* ---------- barra global e segmentações ---------- */
function nav() {
  document.getElementById('gnav').innerHTML = `<a class="brand" href="#inicio" data-act="pg" data-pg="inicio"><img src="assets/reckitt_logo.png" alt="Reckitt">Dash Geral CTO</a>` +
    PAGES.map(([k, n]) => `<a class="nav ${S.page === k ? 'on' : ''}" href="#${k}" data-act="pg" data-pg="${k}">${n}</a>`).join('') +
    `<span class="upd">Atualizado em ${D.gerado.split(' ')[0]}</span>` +
    (window.DASH_COFRE ? '<a class="nav" href="#sair" data-act="sair" title="Fechar o acesso neste aparelho">Sair</a>' : '');
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
  document.getElementById('fbar').innerHTML = FILTROS.map(([k, n]) => {
    const s = S.f[k];
    const txt = s.size === 1 ? (k === 'grp' || k === 'executivo' ? tit(dic[k][[...s][0]]) : esc(dic[k][[...s][0]])) : n;
    return `<button class="chip ${s.size ? 'on' : ''}" data-act="pop" data-k="${k}">${txt}${s.size > 1 ? ` <span class="n">${s.size}</span>` : ''} <span aria-hidden="true">▾</span></button>`;
  }).join('') + `<button class="chip clear" data-act="limpar" ${ativo ? '' : 'disabled'}>Limpar</button>
    <label class="cut">Mês de corte <select data-act="corte">${ate(D.ult26).map(m => `<option value="${m}" ${m === S.corte ? 'selected' : ''}>${mes(m)}/26</option>`).join('')}</select></label>`;
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
  const t = e.target.closest('[data-act]');
  if (POP && !e.target.closest('.pop') && !(t && t.dataset.act === 'pop')) fecharPop();
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'pop') { if (POP && POP.k === t.dataset.k) fecharPop(); else abrirPop(t.dataset.k, t); }
  else if (act === 'limpar') { FILTROS.forEach(([k]) => S.f[k].clear()); atualizar(); }
  else if (act === 'med') { S.ui['m' + t.dataset.bid] = t.dataset.m; document.getElementById('b-' + t.dataset.bid).innerHTML = blocoIn(t.dataset.bid); }
  else if (act === 'ui') {
    S.ui[t.dataset.k] = t.dataset.v; if (t.dataset.k === 'bnv') S.ui.pag = 0; render(false);
    if ((t.dataset.k === 'scsel' || t.dataset.k === 'clsel') && t.dataset.v) { const d = document.querySelector('#app .det'); if (d) scrollTo({top: d.getBoundingClientRect().top + scrollY - 120}); }
  }
  else if (act === 'pg') { e.preventDefault(); irPara(t.dataset.pg); }
  else if (act === 'csv') baixarCSV(t);
  else if (act === 'sair') { e.preventDefault(); try { localStorage.removeItem('dash-geral-cto-chave'); } catch (x) { /* nada guardado */ } location.replace(location.pathname); }
  else if (act === 'pag') { const np = Math.max(1, Math.ceil(linhasBase().length / 50)); S.ui.pag = Math.min(np - 1, Math.max(0, (S.ui.pag || 0) + +t.dataset.d)); render(false); }
  else if (act === 'sort') { const k = 'sort' + t.dataset.t; S.ui[k] = S.ui[k] === t.dataset.c ? '-' + t.dataset.c : t.dataset.c; render(false); }
});
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'corte') { S.corte = +e.target.value; atualizar(); }
});
function irPara(pg) { const mudou = pg !== S.page; S.page = pg; S.ui.pag = 0; gravarHash(mudou); render(); scrollTo({top: 0}); }
function atualizar(manterPop) {
  S.ui.pag = 0; filtrar(); gravarHash(); fbar(); render(false);
  if (manterPop && POP) { const btn = document.querySelector(`.chip[data-k="${POP.k}"]`); if (btn) { const r = btn.getBoundingClientRect(); POP.el.style.top = (r.bottom + 8) + 'px'; } }
}
// voltar/avançar do navegador e links colados: relê o endereço
let ULTIMO = location.hash;
function doEndereco() {
  if (ART || location.hash === ULTIMO) return;
  ULTIMO = location.hash; const antes = S.page;
  lerHash(); filtrar(); fbar(); render(); if (S.page !== antes) scrollTo({top: 0});
}
addEventListener('hashchange', doEndereco);
addEventListener('popstate', doEndereco);
// gráficos acompanham a largura da tela
let LARG = innerWidth, tRz = null;
addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => { if (Math.abs(innerWidth - LARG) > 60) { LARG = innerWidth; render(false); } }, 200); });

/* ---------- páginas (mesma ordem das abas do Dash Power Query) ---------- */
function hero(eyebrow, t1, t2, side = '') {
  return `<section class="hero${eyebrow ? ' sm' : ''}"><div>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${t1} <span>${t2}</span></h1></div>${side}</section>`;
}
function recorteTxt() {
  const p = FILTROS.filter(([k]) => S.f[k].size).map(([k, n]) => `${n}: ${[...S.f[k]].map(i => tit(dic[k][i])).join(', ')}`);
  return p.length ? `<p class="note">Recorte aplicado · ${p.join(' · ')}</p>` : '';
}

function pgInicio() {
  const op = {marcas: gMarcas(), segs: gSegs()};
  const side = `<div class="side">${(D.equipe || []).map(([cargo, nome]) => `${esc(cargo)} <span class="lk">${esc(nome)}</span>`).join('<br>')}<br>Corte ${mes(S.corte)}/26 · ${n0(D.rows.length)} linhas na base</div>`;
  let h = hero('', 'Dash Geral CTO.', 'Sell out do Centro-Oeste, mês a mês.', side);
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
    ate(12).map(m => `<tr><td class="b">${MESES[m - 1]}</td>${ANOS.map(y => `<td class="${y === 2026 ? 'b' : ''}">${n2(v(a, y, m))}</td>`).join('')}<td>${vc(varr(v(a, 2026, m), v(a, 2025, m)))}</td></tr>`).join('') + '</tbody></table></div></div>';
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
  let h = kpis(op) + `<h2 class="sec">${tit(rotulo)} · visão marca. <span>R$, caixas e PDVs mês a mês.</span></h2>` + bloco(chave, tit(rotulo), op);
  // matriz segmento x mês
  const med = S.ui['mat' + chave] || 'rs';
  const segs = segsDaMarca(nomes).filter(s => !segsG || segsG.has(s));
  const C = cubo(med, {marcas: mk, segs: segsG || new Set(segsDaMarca(nomes)), chave: r => r[COL.segmento]});   // matriz sempre no nível segmento
  const L = segs.map(s => ({s, a: C.get(s)})).filter(x => x.a).map(x => ({...x, y25: ytd(x.a, 2025, med), y26: ytd(x.a, 2026, med)})).sort((a, b) => (b.y26 || 0) - (a.y26 || 0));
  const botoesMat = `<div class="seg">${Object.keys(MED).map(k => `<button data-act="ui" data-k="mat${chave}" data-v="${k}" class="${k === med ? 'on' : ''}">${MED[k].nome}</button>`).join('')}</div>`;
  if (!L.length) return h + `<div class="card">${botoesMat}<div class="empty">Sem segmento para este recorte.</div></div>`;
  const tot = new Float64Array(48).fill(NaN);
  L.forEach(x => x.a.forEach((val, i) => { if (!isNaN(val)) tot[i] = (isNaN(tot[i]) ? 0 : tot[i]) + val; }));
  const T = {s: -1, a: tot, y25: ytd(tot, 2025, med), y26: ytd(tot, 2026, med)};
  const media = MED[med].media, nomeS = s => (s < 0 ? 'Total' : tit(dic.segmento[s]));
  const meses = [...ate(12).map(m => [2025, m]), ...ate(12).map(m => [2026, m])];
  h += `<h2 class="sec">Segmentos mês a mês. <span>${med === 'pdv' ? 'PDVs somam segmentos (o mesmo PDV aparece em mais de um).' : 'Peso de cada segmento no acumulado de 2026.'}</span></h2><div class="card">
    ${botoesMat}
    <div class="tw"><table><thead><tr><th>Segmento</th>${meses.map(([y, m]) => `<th>${MESES[m - 1]}/${String(y).slice(2)}</th>`).join('')}<th>${media ? 'Média' : 'YTD'} 25</th><th>${media ? 'Média' : 'YTD'} 26</th><th>26 vs 25</th>${media ? '' : '<th>Peso 26</th>'}</tr></thead><tbody>` +
    [...L, T].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>${meses.map(([y, m]) => `<td class="${y === 2026 ? 'b' : ''}">${n0(v(x.a, y, m))}</td>`).join('')}
      <td>${n0(x.y25)}</td><td class="b">${n0(x.y26)}</td><td>${vc(varr(x.y26, x.y25))}</td>${media ? '' : `<td>${p1(x.y26 / T.y26)}</td>`}</tr>`).join('') + '</tbody></table></div>';
  // trimestres
  h += `<p class="eyebrow" style="margin-top:26px">Trimestres · ${MED[med].nome}</p><div class="tw"><table><thead><tr><th>Segmento</th>` +
    [1, 2, 3, 4].map(q => `<th>Q${q}'25</th><th>Q${q}'26</th><th>Desvio Q${q}</th>`).join('') + `${media ? '' : '<th>Peso seg.</th>'}<th>YTD</th></tr></thead><tbody>` +
    [...L, T].map(x => `<tr class="${x.s < 0 ? 'tot' : ''}"><td class="b">${nomeS(x.s)}</td>` + [1, 2, 3, 4].map(q => {
      const ms = [q * 3 - 2, q * 3 - 1, q * 3], ok = ms.filter(m => m <= S.corte && isFinite(v(x.a, 2026, m)));
      const a26 = agg(x.a, 2026, ms, media), a25 = agg(x.a, 2025, ms, media), d = ok.length ? varr(agg(x.a, 2026, ok, media), agg(x.a, 2025, ok, media)) : NaN;
      return `<td>${n0(a25)}</td><td class="b">${n0(a26)}</td><td>${vc(d)}</td>`;
    }).join('') + `${media ? '' : `<td>${p1(x.y26 / T.y26)}</td>`}<td class="b">${vc(varr(x.y26, x.y25))}</td></tr>`).join('') + '</tbody></table></div>' +
    `<p class="note" style="margin:10px 0 0">O desvio do trimestre compara só os meses de 2026 já fechados contra os mesmos meses de 2025.</p></div>`;
  // segmento a segmento
  const RS_ = med === 'rs' ? C : cubo('rs', {marcas: mk, segs: segsG, chave: r => r[COL.segmento]});
  const ordem = L.map(x => x.s);
  let sel = +(S.ui['sg' + chave] ?? ordem[0]); if (!ordem.includes(sel)) sel = ordem[0];
  h += `<h2 class="sec">Segmento a segmento. <span>Escolha o segmento para abrir R$, caixas e PDVs.</span></h2><div class="shelf">` + ordem.map(s => {
    const a = RS_.get(s); if (!a) return ''; const y26 = ytd(a, 2026, 'rs'), y25 = ytd(a, 2025, 'rs');
    return `<button class="card kpi" data-act="ui" data-k="sg${chave}" data-v="${s}" style="border:0;text-align:left;cursor:pointer;flex-basis:220px;${s === sel ? 'box-shadow:inset 0 0 0 2px #1D1D1F' : ''}">
      <div class="lab">${tit(dic.segmento[s])}</div><div class="val" style="font-size:26px">${mi(y26)}</div><div class="sub">${vc(varr(y26, y25))} sobre 2025</div></button>`;
  }).join('') + '</div>';
  h += bloco(chave + '_s' + sel, `${tit(rotulo)} · ${tit(dic.segmento[sel])}`, {marcas: mk, segs: new Set([sel])});
  return h;
}
function pgMarca(pg) {
  const nome = MARCA_PAG[pg][0];
  const sub = {VEJA: 'Multiuso, limpeza pesada, cozinha, banheiro e vidros.', VANISH: 'Tira manchas em líquido, pó e barra.', HARPIC: 'Cuidado do vaso: pedra, pastilha, caixa acoplada e líquido.', FINISH: 'Lava-louças: pó, secante e tabletes.'}[nome];
  return hero(`<span class="${mkCls(nome)}">${tit(nome)}</span>`, `${tit(nome)}.`, sub) + recorteTxt() + secaoMarca(pg, nome, MARCA_PAG[pg]);
}
function pgHN() {
  let h = hero('Dash H&N', 'Health & Nutrition.', 'Sustagen, Bem Estar Sexual (Jontex + Olla) e Veet.') + recorteTxt();
  h += `<div class="pills">${HN.map(([r], i) => `<button data-act="ui" data-k="hn" data-v="${i}" class="${+(S.ui.hn || 0) === i ? 'on' : ''}">${tit(r)}</button>`).join('')}</div>`;
  const [rot, mks] = HN[+(S.ui.hn || 0)];
  return h + secaoMarca('hn' + (S.ui.hn || 0), rot, mks);
}

function pgDiretor() {
  const segs = gSegs(), MK = ['VEJA','VANISH','HARPIC','FINISH'];
  const R = cubo('rs', {segs, chave: r => r[COL.grp] + '|' + r[COL.marca]});
  const RT = cubo('rs', {marcas: gMarcas(), segs, chave: r => r[COL.grp]}), CT = cubo('cx', {marcas: gMarcas(), segs, chave: r => r[COL.grp]});
  const y = (a, yr) => (a ? agg(a, yr, ate(S.corte), false) : NaN);
  const linhas = D.depara.map(d => {
    const g = id('grp', d.grp);
    const cols = MK.map(m => [y(R.get(g + '|' + id('marca', m)), 2025), y(R.get(g + '|' + id('marca', m)), 2026)]);
    cols.push([y(RT.get(g), 2025), y(RT.get(g), 2026)], [y(CT.get(g), 2025), y(CT.get(g), 2026)]);
    return {nome: tit(d.grp), uf: d.uf, cols};
  }).filter(l => l.cols.some(c => isFinite(c[0]) || isFinite(c[1])));
  const tsum = j => [0, 1].map(k => linhas.reduce((s, l) => s + (isFinite(l.cols[j][k]) ? l.cols[j][k] : 0), 0));
  const tot = {nome: 'Total Área 7 + JC PA', uf: '', cols: linhas[0] ? linhas[0].cols.map((_, j) => tsum(j)) : []};
  const sk = S.ui.sortrob || '-5';
  const j = Math.abs(+sk), desc = sk.startsWith('-');
  linhas.sort((a, b) => ((b.cols[j][1] || 0) - (a.cols[j][1] || 0)) * (desc ? 1 : -1));
  const heads = [...MK.map(tit), 'Total R$', 'Caixas'];
  const row = (l, c) => `<tr class="${c || ''}"><td class="l b">${l.nome}</td><td class="l">${l.uf}</td>` + l.cols.map(([a, b]) => `<td>${n0(a)}</td><td class="b">${n0(b)}</td><td>${vc(varr(b, a))}</td>`).join('') + '</tr>';
  return hero('Visão do Diretor', 'Distribuidor x marca.', `Acumulado de ${corteTxt()}, 2025 contra 2026.`) + recorteTxt() +
    `<div class="card"><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th>` +
    heads.map((hh, i) => `<th class="sort" data-act="sort" data-t="rob" data-c="${i}" colspan="3" style="text-align:center">${hh} ${Math.abs(+sk) === i ? (desc ? '↓' : '↑') : ''}</th>`).join('') +
    `</tr><tr><th></th><th></th>${heads.map(() => '<th>2025</th><th>2026</th><th>Var.</th>').join('')}</tr></thead><tbody>${linhas.map(l => row(l)).join('')}${row(tot, 'tot')}</tbody></table></div>
    <p class="note" style="margin:12px 0 0">Clique no nome da coluna para ordenar pelo valor de 2026. As colunas de marca respeitam o filtro de segmento; Total R$ e Caixas respeitam marca e segmento.</p></div>`;
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
const BASE_COMP = new Set(RD && RD.base_comp ? RD.base_comp : ['DAC DISTRIBUIDORA', 'RIO VERMELHO', 'A.S.E. - ANAPOLIS GO', 'COMERCIAL ALVORADA']);
const RM = RD ? RD.meses : [];
const nomeRaiz = r => { if (r === 'DEMAIS') return 'Demais clientes'; if (r === 'PF') return 'Pessoa física e sem CNPJ'; const n = RD.nomes[r] || {}; return (n.fantasia || n.razao || 'CNPJ ' + r); };
const mesesAte = (ano, n) => ate(n).map(m => RM.indexOf(`${ano}${String(m).padStart(2, '0')}`)).filter(i => i >= 0);
const varR = (a, b) => (isFinite(a) && isFinite(b) && b >= 1000 && a > 0 && a / b <= 10 ? a / b - 1 : NaN);   // evita % absurdo sobre base mínima
const rsx = v => (Math.abs(v) >= 1e6 ? mi(v) : 'R$ ' + n0(v));   // R$ Mi só a partir de 1 milhão
const varQ = (a, b) => (isFinite(b) && b >= 1000 && !(a > 0) ? -1 : varR(a, b));   // base relevante e zero agora = parou de vender (-100%)
function parR(arr, ref) {   // soma 26 e 25 só nos meses até o corte com valor nos dois anos (ref decide o pareamento)
  ref = ref || arr; let a = 0, b = 0;
  for (let m = 1; m <= S.corte; m++) { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`);
    if (ref[i5] > 0 && ref[i6] > 0) { a += arr[i6] || 0; b += arr[i5] || 0; } }
  return [a, b];
}
const somaI = (arr, idx) => idx.reduce((s, i) => s + (arr[i] || 0), 0);
const ytdR = (arr, ano) => somaI(arr, mesesAte(ano, S.corte));
function triR(arr) {   // últimos 3 meses até o corte contra os 3 anteriores (tendência dentro de 2026)
  const fim = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`);
  if (fim < 5) return [NaN, NaN];
  return [somaI(arr, [fim - 2, fim - 1, fim]), somaI(arr, [fim - 5, fim - 4, fim - 3])];
}
function serie48(arr) {
  const a = new Float64Array(48).fill(NaN);
  RM.forEach((m, i) => { const y = +m.slice(0, 4), mo = +m.slice(4); if (arr[i]) a[(y - ANO0) * 12 + mo - 1] = arr[i]; });
  for (let m = S.corte; m < 12; m++) a[36 + m] = NaN;
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
function pgRedesScan() {
  if (!RD) return hero('Redes Scanntech', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
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
  let h = hero('Redes Scanntech', 'Redes de varejo.', 'Venda das lojas, mercado da rede e share da Reckitt. Clique numa rede para abrir.') + recorteTxt();
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
    <div class="card kpi"><div class="lab">Share da Reckitt</div><div class="val">${p1(sh26)}</div><div class="sub dv">${vpp(sh26 - sh25)}<span>${p1(sh25)} em 2025</span></div></div>
    <div class="card kpi"><div class="lab">Redes com venda</div><div class="val">${n0(itens.length)}</div><div class="sub">${mi(tudo26)} de Reckitt em 2026, incluindo as que só liberam a Reckitt</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Reckitt ${corteTxt()} 2026 contra 2025, por rede e UF.</span></h2>` + termometro(itens);
  if (sel) h += detalheScan(sel);
  RD_ULT = {tipo: 'sc', itens};
  h += `<h2 class="sec">Todas as redes. <span>Ordene pelo cabeçalho; busque pelo nome.</span></h2><div class="card"><div class="pills">${buscaRede('scbusca', S.ui.scbusca, 'Buscar rede')}</div><div id="rd-tab">${tabelaScan(itens)}</div></div>`;
  return h;
}
function tabelaScan(itens) {
  const busca = semAcento(S.ui.scbusca || '');
  let lista = itens.filter(x => !busca || semAcento(x.s.rede).includes(busca));
  lista = ordena(lista, 'sc', [x => x.s.rede, x => x.s.uf, x => x.r25, x => x.r26, x => x.vr, x => x.vm, x => x.sh, x => x.dsh, x => x.tr], 3);
  const mostra = S.ui.sctodas ? lista : lista.slice(0, 60);
  return `<div class="tw"><table><thead><tr>${thSort('sc', 0, 'Rede', 'l')}${thSort('sc', 1, 'UF', 'l')}${thSort('sc', 2, 'Reckitt 25')}${thSort('sc', 3, 'Reckitt 26')}${thSort('sc', 4, 'Reckitt var.')}${thSort('sc', 5, 'Mercado var.')}${thSort('sc', 6, 'Share 26')}${thSort('sc', 7, 'Δ share')}${thSort('sc', 8, 'Últ. 3m vs 3 ant.')}<th class="l">Leitura</th><th class="l">No Colecta</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="11" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => `<tr class="clk" data-act="ui" data-k="scsel" data-v="${esc(x.s.rede + '|' + x.s.uf)}"><td class="l b">${tit(x.s.rede)}</td><td class="l">${x.s.uf}</td><td>${n0(x.r25)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}</td><td>${vc(x.vm)}</td><td>${p1(x.sh)}</td><td>${isFinite(x.dsh) ? `<span class="vr ${cls(x.dsh / 100) || 'flat'}">${x.dsh > 0 ? '+' : ''}${nf1.format(x.dsh)} pp</span>` : ''}</td><td>${vc(x.tr)}</td><td class="l">${selo(leituraRede(x.vr, x.vm, x.s.so, x.motivo))}</td><td class="l">${x.col ? '<span class="tag">✓ cruzada</span>' : ''}</td></tr>`).join('') +
    `</tbody></table></div>${!S.ui.sctodas && lista.length > 60 ? `<div class="pager"><button data-act="ui" data-k="sctodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Reckitt R$ = mercado da rede × share da Reckitt (Scanntech, Resumo por Rede Mensal). A variação compara só os meses em que a rede vendeu nos dois anos (mesmas redes e mesmos meses); "Parou de vender" = tinha venda em 2025 e zerou em 2026. Redes que só liberam a venda da Reckitt ficam fora do mercado e do share.</p>`;
}
function detalheScan(x) {
  const s = x.s, a = serie48(s.rk);
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${s.uf} · Scanntech</p><h3>${tit(s.rede)}. <span>${x.motivo ? x.motivo[0] + '.' : !(x.r26 > 0) ? 'Sem venda da Reckitt em 2026.' : s.so ? 'Só libera a venda da Reckitt.' : `Share de ${p1(x.sh)} em 2026.`}</span></h3></div><button class="btn" data-act="ui" data-k="scsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">Reckitt 26 contra 25</span>' : ''}${!s.so && isFinite(x.vm) ? vbig(x.vm) + '<span class="sub">mercado da rede</span>' : ''}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(a, 'rs', 250, null, true, {fv: varR})}<div class="tw"><table><thead><tr><th>Mês</th><th>Mercado 25</th><th>Mercado 26</th><th>Reckitt 25</th><th>Reckitt 26</th><th>Reckitt var.</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= S.corte;
      const m5 = s.mk[i5], m6 = ok6 ? s.mk[i6] : 0, r5 = s.rk[i5], r6 = ok6 ? s.rk[i6] : 0, s5 = m5 ? r5 / m5 : NaN, s6 = m6 ? r6 / m6 : NaN, d = (s6 - s5) * 100;
      return `<tr><td class="b">${MESES[m - 1]}</td><td>${n0(m5 || NaN)}</td><td class="b">${n0(m6 || NaN)}</td><td>${n0(r5 || NaN)}</td><td class="b">${n0(r6 || NaN)}</td><td>${vc(varR(r6, r5))}</td><td>${s.so ? '' : p1(s5)}</td><td>${s.so ? '' : p1(s6)}</td><td>${!s.so && isFinite(d) ? `<span class="vr ${cls(d / 100) || 'flat'}">${d > 0 ? '+' : ''}${nf1.format(d)} pp</span>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>';
  h += marcasScanDet(s.rede + '|' + s.uf);
  h += cruzadoColecta(x.col, s.uf);
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
    cats.map(x => `<p class="eyebrow" style="margin-top:18px;color:var(--slate)">${esc(x.c)}</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.</th><th>Share 25</th><th>Share 26</th><th>Δ share</th></tr></thead><tbody>` +
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
    ${r26 >= 1000 ? chart(serie48(tot), 'rs', 200, null, true, {semVar: true}) : ''}</div>`;
}

/* ----- Redes Colecta ----- */
const recorteGrp = g => (g === 'JC DISTR. PA' ? 'JC PA (FORA DA ÁREA 7)' : 'ÁREA 7');   // recorte é do distribuidor, como no resto do site
function colLinhas(semMarca) {
  const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte'), mk = semMarca ? null : marcasRede();
  const fonte = mk && RD.colm ? RD.colm.filter(c => mk.has(c.marca)) : RD.col;
  return fonte.filter(c => (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec)) && (!rc || rc.has(recorteGrp(c.grp))));
}
const temBase = c => BASE_COMP.has(c.grp);
function triFora(L) {   // distribuidores do recorte que ficam fora da tendência por não cobrirem as 6 janelas
  const fim = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`), ini = RD.inicio_tend || RD.dist_inicio; if (fim < 5) return [];
  return [...new Set(L.filter(c => (ini[c.grp] || '9') > RM[fim - 5]).map(c => tit(c.grp)))];
}
function triCol(L) {   // tendência só com distribuidores que já existiam nas 6 janelas
  const fim = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`); if (fim < 5) return [NaN, NaN];
  const ini = RD.inicio_tend || RD.dist_inicio;
  return triR(somaArr(L.filter(c => (ini[c.grp] || '9') <= RM[fim - 5]), 'rs'));
}
const EXEC_GRP = {}; if (RD) RD.col.forEach(c => { EXEC_GRP[c.grp] = c.exec; }); if (RD && RD.colm) RD.colm.forEach(c => { c.exec = EXEC_GRP[c.grp] || ''; });
function pgRedesCol() {
  if (!RD) return hero('Redes Colecta', 'Sem base de redes.', 'Gere o arquivo de dados com a base de redes.');
  const L = colLinhas(), mk = marcasRede(), lojasDe = mk && mk.size > 1 ? colLinhas(true) : null;   // várias marcas: lojas da rede inteira (sem somar marca a marca)
  const por = new Map();
  L.forEach(c => { const x = por.get(c.raiz) || {raiz: c.raiz, linhas: []}; x.linhas.push(c); por.set(c.raiz, x); });
  const itens = [...por.values()].map(x => {
    const rs = somaArr(x.linhas, 'rs'), lj = somaArr(lojasDe ? lojasDe.filter(c => c.raiz === x.raiz) : x.linhas, 'lj'), base = x.linhas.filter(temBase), rb = somaArr(base, 'rs');
    const r26 = ytdR(rs, 2026), b25 = ytdR(rb, 2025), b26 = ytdR(rb, 2026), [t3, t0] = triCol(x.linhas);
    const ult = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`);
    return {raiz: x.raiz, linhas: x.linhas, rs, lj, r26, b26, b25, vr: varQ(b26, b25), parcial: base.length < x.linhas.length, tr: varQ(t3, t0), v: varQ(t3, t0),
      lojas: lj[ult] || 0, ufs: [...new Set(x.linhas.map(c => c.uf))].join(', '), grps: [...new Set(x.linhas.map(c => c.grp))], sc: CRUZ['r:' + x.raiz]};
  }).filter(x => x.r26 > 0 || x.b25 > 0);
  const tot = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs'), r26 = ytdR(tot, 2026), b26 = ytdR(base, 2026), b25 = ytdR(base, 2025);
  const ult = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`), lojasUlt = somaArr(lojasDe || L, 'lj')[ult] || 0;
  const chU = (() => { if (mk || S.f.recorte.size) return null; const ex = nomesSel('executivo'), uf = nomesSel('uf'), gr = nomesSel('grp'); const p = [];
    if (ex) { if (ex.size > 1) return null; p.push('exec:' + [...ex][0]); } if (gr) { if (gr.size > 1 || ex) return null; p.push('grp:' + [...gr][0]); } if (uf) { if (uf.size > 1) return null; p.push('uf:' + [...uf][0]); } return p.join('|'); })();
  const unicosUlt = chU !== null && RD.unicos && RD.unicos[chU] ? RD.unicos[chU][ult] || 0 : null;
  const nomeadas = itens.filter(x => x.raiz !== 'DEMAIS' && x.raiz !== 'PF').sort((a, b) => b.r26 - a.r26);
  const top20 = nomeadas.slice(0, 20).reduce((a, x) => a + x.r26, 0);
  const sel = S.ui.clsel ? itens.find(x => x.raiz === S.ui.clsel) : null;
  let h = hero('Redes Colecta', 'Redes compradoras.', 'Clientes dos distribuidores agrupados por rede (raiz do CNPJ). Filtre executivo, UF e distribuidor no topo.') + recorteTxt();
  if (S.f.marca.size && !RD.colm) h += '<p class="note">A abertura por marca das redes do Colecta ainda não está na base: os números são de todas as marcas.</p>';
  else if (S.f.marca.size) h += `<p class="note">Recorte por marca: ${[...S.f.marca].map(i => tit(dic.marca[i])).join(', ')}.${temHN() ? ' Sustagen, Jontex, Olla e Veet aparecem juntos como H&N nas redes.' : ''}</p>`;
  if (S.f.segmento.size) h += '<p class="note">O segmento não abre nas redes: os números são da marca inteira.</p>';
  if (['canal', 'fonte', 'janela'].some(k => S.f[k].size)) h += '<p class="note">Canal, fonte e comparabilidade não se aplicam às redes do Colecta: os números são de todos os canais. Aqui valem UF da loja, distribuidor, executivo, recorte e marca.</p>';
  if (S.f.uf.size) h += '<p class="note">A UF aqui é a da loja (cadastro do CNPJ), não a do distribuidor. Lojas da BA e do MA (atendidas pelo JC Atacado) só aparecem sem filtro de UF.</p>';
  h += `<div class="grid g4">
    <div class="card kpi"><div class="lab">Compra das redes ${corteTxt()}</div><div class="val">${mi(r26)}</div><div class="sub dv">${b25 >= 1000 ? vbig(varr(b26, b25)) + `<span>26 contra 25 na base comparável (${[...new Set(L.filter(temBase).map(c => tit(c.grp)))].join(', ')})</span>` : '<span>sem base comparável de 2025 neste recorte</span>'}</div></div>
    <div class="card kpi"><div class="lab">Tendência</div><div class="val ${cls(varR(...triCol(L)))}">${isFinite(varR(...triCol(L))) ? pc(varR(...triCol(L))) : '·'}</div><div class="sub">${isFinite(varR(...triCol(L))) ? 'últimos 3 meses contra os 3 anteriores' + (triFora(L).length ? ' (sem ' + triFora(L).join(', ') + ', que não cobre as 6 janelas)' : '') : 'sem as 6 janelas de comparação: o distribuidor entrou depois'}</div></div>
    <div class="card kpi"><div class="lab">Lojas compradoras em ${mes(S.corte)}</div><div class="val">${n0(unicosUlt !== null ? unicosUlt : lojasUlt)}</div><div class="sub">${unicosUlt !== null ? `CNPJs únicos; soma por distribuidor ${n0(lojasUlt)} (sobreposição ${p1(1 - unicosUlt / lojasUlt)})` : `CNPJs, soma por distribuidor${lojasDe ? ' (todas as marcas)' : ''}`}; ${n0(nomeadas.length)} redes nomeadas</div></div>
    <div class="card kpi"><div class="lab">Concentração</div><div class="val">${p1(top20 / r26)}</div><div class="sub">do R$ nas 20 maiores redes</div></div></div>`;
  h += `<h2 class="sec">Quantas crescem e quantas caem. <span>Tendência dos últimos 3 meses contra os 3 anteriores, por rede.</span></h2>` + termometro(nomeadas);
  if (sel) h += detalheCol(sel);
  RD_ULT = {tipo: 'cl', itens};
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
  return `<div class="tw"><table><thead><tr>${thSort('cl', 0, 'Rede', 'l')}${thSort('cl', 1, 'UF', 'l')}<th class="l">Distribuidor</th>${thSort('cl', 2, 'R$ 25 (base)')}${thSort('cl', 3, 'R$ 26')}${thSort('cl', 4, '26 vs 25')}${thSort('cl', 5, 'Últ. 3m vs 3 ant.')}${thSort('cl', 6, `Lojas ${mes(S.corte)}`)}<th class="l">Na Scanntech</th></tr></thead><tbody>` +
    (mostra.length ? '' : '<tr><td colspan="9" class="empty">Nada neste recorte.</td></tr>') + mostra.map(x => { const n = RD.nomes[x.raiz] || {}; return `<tr class="clk" data-act="ui" data-k="clsel" data-v="${x.raiz}"><td class="l b">${tit(nomeRaiz(x.raiz))}${n.municipio ? `<div class="mini">${esc(n.municipio)}</div>` : ''}</td><td class="l">${x.ufs}</td><td class="l">${x.grps.map(tit).join(', ')}</td><td>${n0(x.b25 || NaN)}</td><td class="b">${n0(x.r26)}</td><td>${vc(x.vr)}${x.parcial && isFinite(x.vr) ? '<span class="mini"> base parcial</span>' : ''}</td><td>${vc(x.tr)}</td><td>${n0(x.lojas || NaN)}</td><td class="l">${x.sc ? `<span class="tag">✓ ${x.sc.map(k => tit(k.split('|')[0])).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</span>` : ''}</td></tr>`; }).join('') +
    `</tbody></table></div>${!S.ui.cltodas && lista.length > 80 ? `<div class="pager"><button data-act="ui" data-k="cltodas" data-v="1">Mostrar todas as ${n0(lista.length)} redes</button></div>` : ''}
    <p class="note" style="margin:12px 0 0">Rede = raiz do CNPJ (8 dígitos); nome pela Receita. As 1.000 maiores redes aparecem nomeadas; o resto está em "Demais clientes". 26 contra 25 só nos distribuidores com 2025 completo no Colecta (DAC, Rio Vermelho, A.S.E. e Alvorada) (acumulado, mês sem compra conta como zero). O JC entrou em jan/26, a Troia em out/25 e a Rede Brasil tem 2025 incompleto: para eles vale a tendência dos últimos 3 meses. Lojas = soma de CNPJs por distribuidor.</p>`;
}
function detalheCol(x) {
  const n = RD.nomes[x.raiz] || {};
  const porG = x.grps.map(g => { const L = x.linhas.filter(c => c.grp === g), rs = somaArr(L, 'rs'); return {g, r26: ytdR(rs, 2026), r25: temBase({grp: g}) ? ytdR(rs, 2025) : NaN, vr: temBase({grp: g}) ? varQ(ytdR(rs, 2026), ytdR(rs, 2025)) : NaN, tr: varQ(...triCol(L))}; }).sort((a, b) => b.r26 - a.r26);
  const rb = somaArr(x.linhas.filter(temBase), 'rs');
  let h = `<div class="card det"><div class="det-top"><div><p class="eyebrow">${x.ufs} · Colecta</p><h3>${tit(nomeRaiz(x.raiz))}. <span>${n.razao ? tit(n.razao) : ''}${n.municipio ? ' · ' + esc(n.municipio) + '/' + (n.uf || '') : ''}${x.raiz.length === 8 ? ' · raiz ' + x.raiz : ''}</span></h3></div><button class="btn" data-act="ui" data-k="clsel" data-v="">Fechar</button></div>
    <div class="termo">${isFinite(x.vr) ? vbig(x.vr) + '<span class="sub">26 contra 25 na base comparável</span>' : '<span class="sub">Sem base comparável de 2025 no Colecta</span>'}${isFinite(x.tr) ? vbig(x.tr) + '<span class="sub">últimos 3 meses contra os 3 anteriores</span>' : ''}</div>
    ${chart(serie48(x.rs), 'rs', 250, null, true, {fv: varR, semVar: x.parcial})}<div class="tw"><table><thead><tr><th>Mês</th><th>R$ 25</th><th>R$ 26</th><th>Var. (base comparável)</th><th>Lojas 25</th><th>Lojas 26</th></tr></thead><tbody>` +
    ate(12).map(m => { const i5 = RM.indexOf(`2025${String(m).padStart(2, '0')}`), i6 = RM.indexOf(`2026${String(m).padStart(2, '0')}`), ok6 = m <= S.corte;
      const a5 = x.rs[i5], a6 = ok6 ? x.rs[i6] : 0; return `<tr><td class="b">${MESES[m - 1]}</td><td>${n0(a5 || NaN)}</td><td class="b">${n0(a6 || NaN)}</td><td>${vc(varR(ok6 ? rb[i6] : 0, rb[i5]))}</td><td>${n0(x.lj[i5] || NaN)}</td><td class="b">${n0(ok6 ? x.lj[i6] || NaN : NaN)}</td></tr>`; }).join('') + '</tbody></table></div>' +
    `<p class="eyebrow" style="margin-top:22px">Por distribuidor</p><div class="tw"><table><thead><tr><th class="l">Distribuidor</th><th>R$ 25</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.</th></tr></thead><tbody>` +
    porG.map(p => `<tr><td class="l b">${tit(p.g)}</td><td>${n0(p.r25)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vr)}</td><td>${vc(p.tr)}</td></tr>`).join('') + '</tbody></table></div><p class="note" style="margin-top:8px">Lojas = soma de CNPJs por distribuidor. 26 contra 25 só nos distribuidores com 2025 completo no Colecta (acumulado; mês sem compra conta como zero).</p>';
  if (RD.colm) {
    const uf = nomesSel('uf'), gr = nomesSel('grp'), ex = nomesSel('executivo'), rc = nomesSel('recorte');
    const Lm = RD.colm.filter(c => c.raiz === x.raiz && (!uf || uf.has(c.uf)) && (!gr || gr.has(c.grp)) && (!ex || ex.has(c.exec || '')) && (!rc || rc.has(recorteGrp(c.grp))));
    const ult = RM.indexOf(`2026${String(S.corte).padStart(2, '0')}`);
    const pm = ['VEJA', 'VANISH', 'FINISH', 'HARPIC', 'HN'].map(m => { const L = Lm.filter(c => c.marca === m); if (!L.length) return null; const rs = somaArr(L, 'rs'), base = somaArr(L.filter(temBase), 'rs');
      return {m, r26: ytdR(rs, 2026), b25: ytdR(base, 2025), vb: varQ(ytdR(base, 2026), ytdR(base, 2025)), tr: varQ(...triCol(L)), lj: somaArr(L, 'lj')[ult] || 0}; }).filter(Boolean);
    const t26 = pm.reduce((a, p) => a + p.r26, 0);
    if (pm.length) h += `<p class="eyebrow" style="margin-top:22px">Marcas na rede</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th>R$ 25 (base)</th><th>R$ 26</th><th>26 vs 25</th><th>Últ. 3m vs 3 ant.</th><th>Peso 26</th><th>Lojas em ${mes(S.corte)}</th></tr></thead><tbody>` +
      pm.sort((a, b) => b.r26 - a.r26).map(p => `<tr><td class="l b ${mkCls(p.m)}">${p.m === 'HN' ? 'H&N' : tit(p.m)}</td><td>${n0(p.b25 || NaN)}</td><td class="b">${n0(p.r26)}</td><td>${vc(p.vb)}</td><td>${vc(p.tr)}</td><td>${p1(p.r26 / t26)}</td><td>${n0(p.lj || NaN)}</td></tr>`).join('') + '</tbody></table></div>';
  }
  if (x.sc) h += x.sc.map(k => { const s = RD.scan.find(z => z.rede + '|' + z.uf === k); if (!s) return ''; const r26 = ytdR(s.rk, 2026), m26 = ytdR(s.mk, 2026), [p26, p25] = parR(s.rk, s.so ? s.rk : s.mk), [q26, q25] = parR(s.mk);
    const r25 = p25, m25 = q25;
    return `<div class="cruz"><p class="eyebrow">A mesma rede na Scanntech · ${s.uf}${S.f.marca.size ? ' · Reckitt inteira' : ''}</p><h3>${tit(s.rede)}: ${mi(r26)} de Reckitt vendidos nas lojas ${corteTxt()}. <span>${s.so ? 'Só libera a Reckitt.' : 'Share de ' + p1(r26 / m26) + '.'}</span></h3>
      <div class="termo">${isFinite(varQ(p26, p25)) ? vbig(varQ(p26, p25)) + '<span class="sub">Reckitt nas lojas, 26 contra 25 (mesmos meses)</span>' : ''}${!s.so && isFinite(varR(q26, q25)) ? vbig(varR(q26, q25)) + '<span class="sub">mercado da rede</span>' : ''}</div>${chart(serie48(s.rk), 'rs', 200, null, true, {fv: varR})}</div>`; }).join('');
  else h += '<p class="note" style="margin-top:16px">Esta rede não foi encontrada na Scanntech (a loja pode não ter leitura de caixa na Scanntech ou ter outro nome de rede).</p>';
  return h + '</div>';
}

function pgDepara() {
  return hero('De-para', 'Distribuidores, fontes e segmentos.', 'Hierarquia do CTO, regra de fonte por período e a régua única entre MTRIX e Colecta.') +
    `<div class="card"><p class="eyebrow">Hierarquia e fonte</p><div class="tw"><table><thead><tr><th class="l">Grp. econômico</th><th class="l">UF</th><th class="l">Canal</th><th class="l">Executivo de vendas</th>
    <th class="l">Fonte 2023-2024</th><th class="l">Fonte 2025</th><th class="l">Fonte 2026</th><th class="l">Série emendada</th><th class="l">Mesma régua</th></tr></thead><tbody>` +
    D.depara.map(d => `<tr><td class="l b">${tit(d.grp)}</td><td class="l">${d.uf}</td><td class="l">${tit(d.canal)}</td><td class="l">${esc(d.executivo)}</td><td class="l">${esc(d.f2324)}</td><td class="l">${esc(d.f25)}</td><td class="l">${esc(d.f26)}</td><td class="l">${d.emendada}</td><td class="l">${d.regua}</td></tr>`).join('') +
    `</tbody></table></div></div><div class="card"><p class="eyebrow">Régua de segmentos · MTRIX (Segmento AR) x Colecta (Subcategoria)</p><div class="tw"><table><thead><tr><th class="l">Marca</th><th class="l">Segmento no dash</th><th class="l">MTRIX</th><th class="l">Colecta</th></tr></thead><tbody>` +
    D.regua.map(x => `<tr><td class="l b ${mkCls(x.marca)}">${tit(x.marca)}</td><td class="l">${tit(x.segmento)}</td><td class="l">${esc(x.mtrix)}</td><td class="l">${esc(x.colecta)}</td></tr>`).join('') + '</tbody></table></div></div>';
}

function linhasBase() {
  const nv = S.ui.bnv || 'TOTAL', mk = gMarcas(), sg = gSegs();
  return BASE.filter(r => (nv === 'TODOS' || r[COL.nivel] === NIV[nv === 'SEGMENTO' ? 'SEG' : nv]) && (!mk || mk.has(r[COL.marca]) || r[COL.marca] === TODAS) && (!sg || sg.has(r[COL.segmento]) || r[COL.segmento] === TODOS));
}
const CAB = ['AnoMes','Ano','Mês','Recorte','UF','Grp. Econômico','Executivo de Vendas','Canal','Fonte','Comparabilidade','Nível','Marca','Segmento','Sell out R$','Caixas','PDVs'];
const celulas = r => [r[0] * 100 + r[1], r[0], MESES[r[1] - 1], ...['recorte','uf','grp','executivo','canal','fonte','janela','nivel','marca','segmento'].map(k => dic[k][r[COL[k]]]), r[RS], r[CX], r[PDV]];
function pgBase() {
  const L = linhasBase().slice().sort((a, b) => b[0] * 100 + b[1] - (a[0] * 100 + a[1])), pg = S.ui.pag || 0, por = 50, np = Math.max(1, Math.ceil(L.length / por));
  const p = Math.min(pg, np - 1); S.ui.pag = p;
  return hero('Base geral', 'A base que alimenta tudo.', `${n0(L.length)} linhas no recorte atual. As segmentações filtram aqui também.`) +
    `<div class="card"><div class="pills">${['TOTAL','MARCA','SEGMENTO','TODOS'].map(n => `<button data-act="ui" data-k="bnv" data-v="${n}" class="${n === (S.ui.bnv || 'TOTAL') ? 'on' : ''}">Nível ${tit(n)}</button>`).join('')}
    <button class="btn dark" data-act="csv" style="margin-left:auto">${ART ? 'Copiar o recorte para o Excel' : 'Baixar CSV do recorte'}</button></div>
    ${ART ? '<textarea id="csvbox" class="csvbox" hidden readonly aria-label="Recorte em texto para copiar"></textarea>' : ''}
    <div class="tw"><table><thead><tr>${CAB.map((c, i) => `<th class="${i > 2 && i < 13 ? 'l' : ''}">${c}</th>`).join('')}</tr></thead><tbody>` +
    L.slice(p * por, p * por + por).map(r => `<tr>${celulas(r).map((c, i) => `<td class="${i > 2 && i < 13 ? 'l' : ''}">${i >= 13 ? n0(c) : esc(c)}</td>`).join('')}</tr>`).join('') +
    `</tbody></table></div><div class="pager"><button data-act="pag" data-d="-1" ${p === 0 ? 'disabled' : ''}>‹ Anterior</button>Página ${p + 1} de ${np}<button data-act="pag" data-d="1" ${p >= np - 1 ? 'disabled' : ''}>Próxima ›</button></div></div>`;
}
function baixarCSV(btn) {
  const L = linhasBase();
  if (ART) {   // o link do claude.ai não deixa a página baixar arquivo: copia em colunas (tab) para colar no Excel
    const c = s => (typeof s === 'number' ? String(s).replace('.', ',') : String(s).replace(/[\t\n]/g, ' '));
    const txt = [CAB.join('\t'), ...L.map(r => celulas(r).map(c).join('\t'))].join('\n');
    const falha = () => { const ta = document.getElementById('csvbox'); if (!ta) return; ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); btn.textContent = 'Texto selecionado: use Cmd+C ou Ctrl+C'; };
    try { navigator.clipboard.writeText(txt).then(() => { btn.textContent = `Copiado: ${n0(L.length)} linhas. Cole no Excel`; }, falha); } catch (e) { falha(); }
    return;
  }
  const q = s => (typeof s === 'number' ? String(s).replace('.', ',') : '"' + String(s).replace(/"/g, '""') + '"');
  const txt = '﻿' + [CAB.map(q).join(';'), ...L.map(r => celulas(r).map(q).join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'text/csv;charset=utf-8'}));
  a.download = `base_dash_cto_corte_${S.corte}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function render(topo = true) {
  nav();
  const y = scrollY;
  const lados = [...document.querySelectorAll('#app .shelf, #app .tw')].map(x => x.scrollLeft);
  const P = {inicio: pgInicio, geral: pgGeral, hn: pgHN, diretor: pgDiretor, 'redes-scan': pgRedesScan, 'redes-col': pgRedesCol, confronto: pgConfronto, depara: pgDepara, base: pgBase};
  const app = document.getElementById('app');
  app.innerHTML = (P[S.page] || (() => pgMarca(S.page)))();
  document.title = (S.page === 'inicio' ? '' : PAGES.find(p => p[0] === S.page)[1] + ' · ') + 'Dash Geral CTO';
  ['scbusca', 'clbusca'].forEach(idb => {   // busca das redes: redesenha só a tabela
    const inp = document.getElementById(idb); if (!inp) return;
    let tB = null;
    const aplica = () => { clearTimeout(tB); tB = setTimeout(() => { S.ui[idb] = inp.value; const box = document.getElementById('rd-tab'); if (box && RD_ULT) box.innerHTML = RD_ULT.tipo === 'sc' ? tabelaScan(RD_ULT.itens) : tabelaCol(RD_ULT.itens); }, 150); };
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

const rod = document.getElementById('rodape');
if (rod) rod.innerHTML = (D.rodape || []).map(t => `<p>${esc(t)}</p>`).join('');
lerHash(); filtrar(); fbar(); render();
})();
