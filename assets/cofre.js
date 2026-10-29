/* Tela de senha da Governança CTO (antigo Dash Geral CTO; chaves de memória mantidas para não derrubar quem já entrou). Os dados chegam criptografados (data/data.enc.js, AES-256-GCM);
   a senha deriva a chave no próprio navegador (PBKDF2-SHA256) e nada sai do aparelho.
   "Lembrar neste aparelho" guarda só a chave derivada, nunca a senha.
   Perfil de cliente: uma segunda senha abre outra base cifrada (data/data_cliente.enc.js), recortada só com o dado daquele cliente.
   A senha do time não abre a base do cliente e a do cliente não abre a do time; cada uma tenta a sua base. */
(() => {
const C = window.DASH_COFRE, GUARDA = 'dash-geral-cto-chave', GUARDA_CLI = 'governanca-cliente-chave';
const VER = ((document.currentScript && document.currentScript.src) || '').split('?v=')[1] || '';   // mesma versão do index para o app.js
const el = id => document.getElementById(id);
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const comVer = src => src + (VER && VER !== '__V__' ? '?v=' + VER : '');

let cofreCli = null;      // base do cliente: só baixa quando precisa (senha que não abriu a do time, ou chave do cliente lembrada)
function carregarCliente() {
  if (cofreCli) return cofreCli;
  cofreCli = new Promise(res => {
    if (window.DASH_COFRE_CLIENTE) return res(window.DASH_COFRE_CLIENTE);
    const s = document.createElement('script'); s.src = comVer('data/data_cliente.enc.js');
    s.onload = () => res(window.DASH_COFRE_CLIENTE || null); s.onerror = () => res(null);
    document.head.appendChild(s);
  });
  return cofreCli;
}
async function abrir(cofre, chave) {
  const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b64(cofre.iv)}, chave, b64(cofre.ct));
  const txt = await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  window.DASH = JSON.parse(txt);
}
async function derivar(cofre, senha) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt: b64(cofre.sal), iterations: cofre.iter, hash: 'SHA-256'},
                                 base, {name: 'AES-GCM', length: 256}, true, ['decrypt']);
}
function iniciar() {
  el('cofre').remove();
  document.body.classList.remove('trancado');
  const s = document.createElement('script'); s.src = comVer('assets/app.js'); document.body.appendChild(s);
}
function mostrar(msg) {
  el('cofre').hidden = false;
  if (msg) el('cofre-msg').textContent = msg;
  el('senha').focus();
}
const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const tirar = k => { try { localStorage.removeItem(k); } catch (e) { /* nada guardado */ } };
const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* aparelho sem memória: pede a senha da próxima vez */ } };

async function comecar() {
  if (!C || !window.crypto || !crypto.subtle || typeof DecompressionStream === 'undefined') {
    return mostrar('Este navegador não abre o dash. Use Chrome, Safari ou Edge atualizados.');
  }
  const guardada = ler(GUARDA), guardadaCli = ler(GUARDA_CLI);
  if (guardada) {
    try {
      const chave = await crypto.subtle.importKey('jwk', JSON.parse(guardada), {name: 'AES-GCM'}, false, ['decrypt']);
      await abrir(C, chave); return iniciar();
    } catch (e) {
      tirar(GUARDA);
      return mostrar('A senha mudou. Digite a senha nova.');
    }
  }
  if (guardadaCli) {
    try {
      const cc = await carregarCliente(); if (!cc) throw new Error('sem base do cliente');
      const chave = await crypto.subtle.importKey('jwk', JSON.parse(guardadaCli), {name: 'AES-GCM'}, false, ['decrypt']);
      await abrir(cc, chave); return iniciar();
    } catch (e) {
      tirar(GUARDA_CLI);
      return mostrar('A senha mudou. Digite a senha nova.');
    }
  }
  mostrar('');
}

el('cofre-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = el('entrar'), senha = el('senha').value;
  if (!senha) return mostrar('Digite a senha.');
  btn.disabled = true; btn.textContent = 'Abrindo…'; el('cofre-msg').textContent = '';
  const lembrar = el('lembrar').checked;
  try {
    const chave = await derivar(C, senha);
    await abrir(C, chave);
    if (lembrar) { gravar(GUARDA, JSON.stringify(await crypto.subtle.exportKey('jwk', chave))); tirar(GUARDA_CLI); }
    return iniciar();
  } catch (e) { /* não é a senha do time: tenta a base do cliente */ }
  try {
    const cc = await carregarCliente(); if (!cc) throw new Error('sem base do cliente');
    const chave = await derivar(cc, senha);
    await abrir(cc, chave);
    if (lembrar) { gravar(GUARDA_CLI, JSON.stringify(await crypto.subtle.exportKey('jwk', chave))); tirar(GUARDA); }
    return iniciar();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Entrar';
    el('senha').select();
    mostrar('Senha incorreta. Confira a senha com o seu gerente.');
  }
});
comecar();
})();
