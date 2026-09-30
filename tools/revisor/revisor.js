// Revisor de pixel art (T23) — interface. Servida pelo Vite (`npm run revisor`); dados pelos endpoints /__revisor/*
// (tools/revisor/plugin.js). O diretor de arte marca áreas com comentário, categoria e prioridade; o comando /revisar
// (.claude/skills/revisar) aplica as correções no código-fonte do gerador; o modo Comparar confere antes × depois.

const $ = (id) => document.getElementById(id);
const RULER = 30;                          // margem das réguas (px de tela)
const CORES = { alta: '#ff5a4e', média: '#ffae3c', baixa: '#e6d58a' };

const S = {
    lista: null, item: null, img: null, quadro: 0, zoom: 8, grade: true,
    rev: { marcacoes: [] }, sujo: false, modo: 'revisar',
    antes: null, piscando: null, piscaLado: false, drag: null, chao: null, orc: null
};

function loadImg (url) {
    return new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    });
}

function setStatus (t) { $('status').textContent = t; }
function marcarSujo (v = true) { S.sujo = v; $('salvar').disabled = !v; }

// ------------------------------------------------------------------ lista
async function carregarLista () {
    S.lista = await (await fetch('/__revisor/lista')).json();
    S.chao = await loadImg(S.lista.chao);
    S.orc = await loadImg(S.lista.orc);
    desenharLista();
}

function desenharLista () {
    const filtro = $('busca').value.toLowerCase();
    const el = $('itens');
    el.innerHTML = '';
    const grupos = [['Primeiro uso', S.lista.destaques.map((n) => S.lista.sprites.find((s) => s.nome === n)).filter(Boolean)]];
    for (const g of [...new Set(S.lista.sprites.map((s) => s.grupo))]) { grupos.push([g, S.lista.sprites.filter((s) => s.grupo === g)]); }
    for (const [nome, itens] of grupos) {
        const vis = itens.filter((s) => s.nome.toLowerCase().includes(filtro));
        if (!vis.length) { continue; }
        const h = document.createElement('div'); h.className = 'grupo'; h.textContent = nome; el.appendChild(h);
        for (const s of vis) {
            const d = document.createElement('div');
            d.className = 'item' + (S.item && S.item.nome === s.nome ? ' sel' : '');
            const r = s.revisao;
            const badge = r ? `<span class="badge ${r.abertas ? '' : 'ok'} ${r.desatualizada ? 'velha' : ''}" title="${r.desatualizada ? 'o PNG mudou desde a revisão' : ''}">${r.abertas}/${r.total}</span>` : '';
            d.innerHTML = `<span>${s.nome}${s.quadros > 1 ? ` <small>(${s.quadros})</small>` : ''}</span>${badge}`;
            d.onclick = () => abrir(s.nome);
            el.appendChild(d);
        }
    }
}

// ------------------------------------------------------------------ abrir sprite
async function abrir (nome) {
    if (S.sujo && !confirm('Há marcações não salvas. Trocar de sprite mesmo assim?')) { return; }
    S.item = S.lista.sprites.find((s) => s.nome === nome);
    S.img = await loadImg(S.item.url);
    S.rev = await (await fetch(`/__revisor/revisao?nome=${encodeURIComponent(nome)}`)).json();
    S.quadro = 0;
    marcarSujo(false);
    $('nomeSprite').textContent = nome;
    $('infoSprite').textContent = `${S.item.arquivo} · ${S.item.w}×${S.item.h}` + (S.item.quadros > 1 ? ` · quadro ${S.item.frame[0]}×${S.item.frame[1]}` : '');
    $('quadroCtl').hidden = S.item.quadros <= 1;
    $('qTotal').textContent = S.item.quadros - 1;
    const aviso = $('aviso');
    aviso.hidden = !(S.rev.hash && S.rev.hash !== S.item.hash);
    aviso.textContent = 'As marcações foram feitas numa versão anterior deste PNG (o sprite foi regerado). Use "Comparar" para conferir antes × depois.';
    await carregarVersoes();
    desenharLista();
    desenharTudo();
}

async function carregarVersoes () {
    const vers = await (await fetch(`/__revisor/versoes?nome=${encodeURIComponent(S.item.nome)}`)).json();
    const sel = $('antesSel');
    sel.innerHTML = '';
    for (const v of vers.sort((a, b) => new Date(b.data) - new Date(a.data))) {
        const o = document.createElement('option'); o.value = v.url; o.textContent = `revisão ${v.arquivo.split('.').slice(-2, -1)[0]} (${new Date(v.data).toLocaleString('pt-BR')})`; sel.appendChild(o);
    }
    const atual = document.createElement('option'); atual.value = S.item.url; atual.textContent = 'o próprio arquivo atual'; sel.appendChild(atual);
    for (const s of S.lista.sprites.filter((x) => x.nome !== S.item.nome && x.w === S.item.w && x.h === S.item.h)) {
        const o = document.createElement('option'); o.value = s.url; o.textContent = `outro sprite: ${s.nome}`; sel.appendChild(o);
    }
    S.antes = await loadImg(sel.value);
}

// ------------------------------------------------------------------ desenho da vista ampliada
function frameRect (img) {
    const [fw, fh] = S.item.frame;
    const cols = Math.max(1, Math.floor(img.width / fw));
    return { sx: (S.quadro % cols) * fw, sy: Math.floor(S.quadro / cols) * fh, fw, fh };
}

function desenharAmpliado (cv, img, comMarcas) {
    const z = S.zoom, { sx, sy, fw, fh } = frameRect(img);
    cv.width = fw * z + RULER * 2; cv.height = fh * z + RULER * 2;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#100c0a'; x.fillRect(0, 0, cv.width, cv.height);
    // fundo xadrez (transparência)
    for (let j = 0; j < fh; j++) { for (let i = 0; i < fw; i++) { x.fillStyle = (i + j) % 2 ? '#2a2420' : '#322a25'; x.fillRect(RULER + i * z, RULER + j * z, z, z); } }
    x.drawImage(img, sx, sy, fw, fh, RULER, RULER, fw * z, fh * z);
    // grade
    if (S.grade && z >= 6) {
        for (let i = 0; i <= fw; i++) { x.fillStyle = i % 8 === 0 ? 'rgba(63,245,255,0.35)' : 'rgba(255,255,255,0.08)'; x.fillRect(RULER + i * z, RULER, 1, fh * z); }
        for (let j = 0; j <= fh; j++) { x.fillStyle = j % 8 === 0 ? 'rgba(63,245,255,0.35)' : 'rgba(255,255,255,0.08)'; x.fillRect(RULER, RULER + j * z, fw * z, 1); }
    }
    // réguas numeradas (todo pixel; destaque a cada 8), nas 4 bordas — como batalha naval
    const fs = Math.max(6, Math.min(11, z - 1));
    x.font = `${fs}px monospace`;
    x.textBaseline = 'middle';
    const num = (n) => { const d = n % 8 === 0; x.fillStyle = d ? '#3ff5ff' : '#8a7a70'; x.font = `${d ? 'bold ' : ''}${fs}px monospace`; return String(n); };
    for (let i = 0; i < fw; i++) {
        const cx = RULER + i * z + z / 2;
        for (const yy of [RULER / 2, RULER + fh * z + RULER / 2]) {
            x.save(); x.translate(cx, yy); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.fillText(num(i), 0, 0); x.restore();
        }
    }
    for (let j = 0; j < fh; j++) {
        const cy = RULER + j * z + z / 2;
        x.textAlign = 'right'; x.fillText(num(j), RULER - 3, cy);
        x.textAlign = 'left'; x.fillText(num(j), RULER + fw * z + 3, cy);
    }
    if (comMarcas) { desenharMarcas(x); }
}

function desenharMarcas (x) {
    const z = S.zoom;
    S.rev.marcacoes.forEach((m, i) => {
        if ((m.quadro || 0) !== S.quadro) { return; }
        const cor = m.status === 'corrigida' ? '#7be38b' : (m.status === 'recusada' ? '#888' : CORES[m.prioridade] || '#fff');
        x.strokeStyle = cor; x.lineWidth = 2;
        x.setLineDash(m.status === 'corrigida' || m.status === 'recusada' ? [5, 4] : []);
        x.strokeRect(RULER + m.x * z - 1, RULER + m.y * z - 1, m.w * z + 2, m.h * z + 2);
        x.setLineDash([]);
        const label = String(i + 1);
        x.font = 'bold 12px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
        const lw = x.measureText(label).width + 8;
        x.fillStyle = cor; x.fillRect(RULER + m.x * z - 1, RULER + m.y * z - 17, lw, 16);
        x.fillStyle = '#100c0a'; x.fillText(label, RULER + m.x * z + 3, RULER + m.y * z - 15);
    });
    if (S.drag) {
        const r = dragRect();
        x.strokeStyle = '#3ff5ff'; x.lineWidth = 2; x.setLineDash([4, 3]);
        x.strokeRect(RULER + r.x * z, RULER + r.y * z, r.w * z, r.h * z);
        x.setLineDash([]);
    }
}

function desenharContexto () {
    const img = S.img;
    for (const [id, k] of [['contexto', 1], ['contexto2', 2]]) {
        const cv = $(id), x = cv.getContext('2d');
        x.imageSmoothingEnabled = false;
        x.save(); x.scale(k, k);
        x.drawImage(S.chao, 330, 430, 260, 170, 0, 0, 260, 170);
        const { sx, sy, fw, fh } = frameRect(img);
        const gx = 110, gy = 150;
        x.drawImage(S.orc, 0, 0, S.orc.width, S.orc.height, 205 - 46, gy - S.orc.height, S.orc.width, S.orc.height);
        x.drawImage(img, sx, sy, fw, fh, Math.round(gx - fw / 2), Math.min(gy - fh + 6, 170 - fh), fw, fh);
        x.restore();
    }
}

function desenharLista2 () {
    const ol = $('marcas');
    ol.innerHTML = '';
    const abertas = S.rev.marcacoes.filter((m) => m.status === 'aberta').length;
    $('contagem').textContent = S.rev.marcacoes.length ? `(${abertas} abertas de ${S.rev.marcacoes.length})` : '';
    S.rev.marcacoes.forEach((m, i) => {
        const li = document.createElement('li');
        li.className = `${m.prioridade} ${m.status}`;
        li.innerHTML = `<div class="cab"><b>#${i + 1}</b><span>${m.categoria} · ${m.prioridade}</span><span>quadro ${m.quadro || 0} · (${m.x},${m.y}) ${m.w}×${m.h}</span></div>
            <div class="txt"></div>${m.resposta ? '<div class="resp"></div>' : ''}
            <div class="acoes"><select>${['aberta', 'corrigida', 'recusada', 'esclarecimento'].map((s) => `<option value="${s}" ${s === m.status ? 'selected' : ''}>${s === 'esclarecimento' ? 'precisa de esclarecimento' : s}</option>`).join('')}</select>
            <button data-ir>ver</button><button data-del>apagar</button></div>`;
        li.querySelector('.txt').textContent = m.comentario;
        if (m.resposta) { li.querySelector('.resp').textContent = '↳ ' + m.resposta; }
        li.querySelector('select').onchange = (e) => { m.status = e.target.value; marcarSujo(); desenharTudo(); };
        li.querySelector('[data-ir]').onclick = () => { S.quadro = m.quadro || 0; $('quadro').value = S.quadro; desenharTudo(); };
        li.querySelector('[data-del]').onclick = () => { if (confirm(`Apagar a marcação #${i + 1}?`)) { S.rev.marcacoes.splice(i, 1); marcarSujo(); desenharTudo(); } };
        ol.appendChild(li);
    });
}

function desenharTudo () {
    if (!S.item) { return; }
    if (S.modo === 'revisar') { desenharAmpliado($('tela'), S.img, true); } else { desenharComparar(); }
    desenharContexto();
    desenharLista2();
}

// ------------------------------------------------------------------ marcação (clique ou retângulo)
function pixelDe (ev) {
    const cv = $('tela'), r = cv.getBoundingClientRect();
    const px = Math.floor(((ev.clientX - r.left) * (cv.width / r.width) - RULER) / S.zoom);
    const py = Math.floor(((ev.clientY - r.top) * (cv.height / r.height) - RULER) / S.zoom);
    const [fw, fh] = S.item.frame;
    return { x: Math.max(0, Math.min(fw - 1, px)), y: Math.max(0, Math.min(fh - 1, py)), dentro: px >= 0 && py >= 0 && px < fw && py < fh };
}
function dragRect () {
    const a = S.drag.a, b = S.drag.b;
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
}
$('tela').addEventListener('mousedown', (ev) => { if (!S.item) { return; } const p = pixelDe(ev); if (!p.dentro) { return; } S.drag = { a: p, b: p }; });
$('tela').addEventListener('mousemove', (ev) => { if (!S.drag) { return; } S.drag.b = pixelDe(ev); desenharAmpliado($('tela'), S.img, true); });
window.addEventListener('mouseup', () => {
    if (!S.drag) { return; }
    const r = dragRect();
    S.drag = null;
    $('dlgArea').textContent = `(${r.x},${r.y}) ${r.w}×${r.h}` + (S.item.quadros > 1 ? ` · quadro ${S.quadro}` : '');
    $('dlgTexto').value = '';
    S.pendente = r;
    $('dlg').showModal();
    $('dlgTexto').focus();
});
// a marcação é registrada no clique (não depende do evento "close" do diálogo)
$('dlgOk').onclick = (ev) => {
    ev.preventDefault();
    const texto = $('dlgTexto').value.trim();
    if (!texto) { $('dlgTexto').focus(); return; }
    S.rev.marcacoes.push({
        id: Date.now().toString(36), quadro: S.quadro, ...S.pendente,
        comentario: texto, categoria: $('dlgCat').value, prioridade: $('dlgPri').value,
        status: 'aberta', criada: new Date().toISOString(), hash: S.item.hash
    });
    S.pendente = null;
    marcarSujo();
    $('dlg').close();
    desenharTudo();
};
$('dlg').querySelector('button[value="cancelar"]').onclick = (ev) => { ev.preventDefault(); S.pendente = null; $('dlg').close(); desenharTudo(); };

// ------------------------------------------------------------------ comparar (lado a lado + piscar)
function desenharComparar () {
    if (S.piscando) {
        desenharAmpliado($('telaAntes'), S.piscaLado ? S.antes : S.img, false);
        $('telaDepois').width = 0;
        $('piscarInfo').textContent = S.piscaLado ? 'mostrando: ANTES' : 'mostrando: DEPOIS';
        return;
    }
    desenharAmpliado($('telaAntes'), S.antes, false);
    desenharAmpliado($('telaDepois'), S.img, true);
    $('piscarInfo').textContent = '';
}
$('piscar').onclick = () => {
    if (S.piscando) { clearInterval(S.piscando); S.piscando = null; $('piscar').textContent = 'Piscar'; desenharTudo(); return; }
    $('piscar').textContent = 'Parar';
    S.piscando = setInterval(() => { S.piscaLado = !S.piscaLado; desenharComparar(); }, 550);
};
$('antesSel').onchange = async () => { S.antes = await loadImg($('antesSel').value); desenharTudo(); };

// ------------------------------------------------------------------ controles
function modo (m) {
    S.modo = m;
    $('modoRevisar').classList.toggle('ativo', m === 'revisar');
    $('modoComparar').classList.toggle('ativo', m === 'comparar');
    $('vistaRevisar').hidden = m !== 'revisar';
    $('vistaComparar').hidden = m !== 'comparar';
    desenharTudo();
}
$('modoRevisar').onclick = () => modo('revisar');
$('modoComparar').onclick = () => modo('comparar');
$('zoom').oninput = (e) => { S.zoom = +e.target.value; $('zoomVal').textContent = `${S.zoom}×`; desenharTudo(); };
$('grade').onchange = (e) => { S.grade = e.target.checked; desenharTudo(); };
$('busca').oninput = desenharLista;
const irQuadro = (q) => { S.quadro = Math.max(0, Math.min(S.item.quadros - 1, q)); $('quadro').value = S.quadro; desenharTudo(); };
$('quadro').onchange = (e) => irQuadro(+e.target.value);
$('qAnt').onclick = () => irQuadro(S.quadro - 1);
$('qProx').onclick = () => irQuadro(S.quadro + 1);
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || !S.item) { return; }
    if (e.key === '+' || e.key === '=') { $('zoom').value = S.zoom = Math.min(16, S.zoom + 1); $('zoomVal').textContent = `${S.zoom}×`; desenharTudo(); }
    if (e.key === '-') { $('zoom').value = S.zoom = Math.max(4, S.zoom - 1); $('zoomVal').textContent = `${S.zoom}×`; desenharTudo(); }
    if (e.key === 'ArrowRight') { irQuadro(S.quadro + 1); } if (e.key === 'ArrowLeft') { irQuadro(S.quadro - 1); }
});
$('salvar').onclick = async () => {
    const r = await fetch(`/__revisor/revisao?nome=${encodeURIComponent(S.item.nome)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marcacoes: S.rev.marcacoes })
    });
    const j = await r.json();
    if (!r.ok) { setStatus('erro ao salvar: ' + j.erro); return; }
    S.rev.hash = j.hash;
    marcarSujo(false);
    setStatus(`salvo em tools/revisor/revisoes/${S.item.nome}.json`);
    const nome = S.item.nome;
    await carregarLista();
    S.item = S.lista.sprites.find((s) => s.nome === nome);
    await carregarVersoes();
    $('aviso').hidden = true;
    desenharTudo();
};
window.addEventListener('beforeunload', (e) => { if (S.sujo) { e.preventDefault(); e.returnValue = ''; } });

carregarLista().then(() => { if (S.lista.destaques[0]) { abrir(S.lista.destaques[0]); } });
