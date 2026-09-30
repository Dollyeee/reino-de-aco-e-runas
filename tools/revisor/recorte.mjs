// Recortes das marcações de revisão (T23) — usado pelo comando /revisar para OLHAR cada área marcada.
//
//   node tools/revisor/recorte.mjs <sprite> --lista                 lista as marcações abertas (alta → baixa)
//   node tools/revisor/recorte.mjs <sprite> --marca <n>             recorte ampliado da marcação n (1 = primeira da lista)
//   node tools/revisor/recorte.mjs <sprite> --marca <n> --antes <png>   antes × depois lado a lado (mesma área e zoom)
//   opções: --zoom 10 (padrão)  --margem 6 (px em volta da área)  --contexto (acrescenta o quadro inteiro 3×)
//
// Saída: tools/revisor/recortes/<sprite>-m<n>[-antes-depois].png (fora do git). O retângulo vermelho é a área marcada.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const sprite = args[0];
const opt = (k, def) => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] ?? true) : def; };
if (!sprite) { console.error('uso: node tools/revisor/recorte.mjs <sprite> [--lista | --marca n [--antes png]]'); process.exit(1); }

const revFile = path.join(ROOT, 'tools', 'revisor', 'revisoes', `${sprite}.json`);
if (!fs.existsSync(revFile)) { console.error(`sem revisão salva para "${sprite}" (${path.relative(ROOT, revFile)})`); process.exit(1); }
const rev = JSON.parse(fs.readFileSync(revFile, 'utf8'));
const ORDEM = { alta: 0, 'média': 1, baixa: 2 };

if (opt('--lista', false)) {
    rev.marcacoes.forEach((m, i) => {
        if (m.status !== 'aberta') { return; }
        console.log(`#${i + 1} [${m.prioridade}] ${m.categoria} · quadro ${m.quadro || 0} · (${m.x},${m.y}) ${m.w}×${m.h} — ${m.comentario}`);
    });
    const abertas = rev.marcacoes.map((m, i) => ({ m, i })).filter(({ m }) => m.status === 'aberta')
        .sort((a, b) => ORDEM[a.m.prioridade] - ORDEM[b.m.prioridade]);
    console.log(`ordem de trabalho (alta → baixa): ${abertas.map(({ i }) => '#' + (i + 1)).join(', ') || 'nenhuma marcação aberta'}`);
    process.exit(0);
}

const n = +opt('--marca', 1);
const m = rev.marcacoes[n - 1];
if (!m) { console.error(`marcação #${n} não existe`); process.exit(1); }
const Z = +opt('--zoom', 10), MG = +opt('--margem', 6);
const [fw, fh] = rev.quadro;

function frameOf (img, q) {
    const cols = Math.max(1, Math.floor(img.width / fw));
    return { ox: (q % cols) * fw, oy: Math.floor(q / cols) * fh };
}

// recorte ampliado da área (com margem), fundo xadrez, grade fraca e retângulo da marcação
function crop (file) {
    const img = PNG.sync.read(fs.readFileSync(file));
    const { ox, oy } = frameOf(img, m.quadro || 0);
    const x0 = Math.max(0, m.x - MG), y0 = Math.max(0, m.y - MG);
    const x1 = Math.min(fw, m.x + m.w + MG), y1 = Math.min(fh, m.y + m.h + MG);
    const w = x1 - x0, h = y1 - y0;
    const out = new PNG({ width: w * Z, height: h * Z });
    for (let y = 0; y < h * Z; y++) {
        for (let x = 0; x < w * Z; x++) {
            const px = x0 + Math.floor(x / Z), py = y0 + Math.floor(y / Z);
            const s = ((oy + py) * img.width + ox + px) * 4, d = (y * w * Z + x) * 4;
            const a = img.data[s + 3] / 255;
            const bg = (px + py) % 2 ? 42 : 50;
            for (let k = 0; k < 3; k++) { out.data[d + k] = Math.round(img.data[s + k] * a + bg * (1 - a)); }
            out.data[d + 3] = 255;
            if (x % Z === 0 || y % Z === 0) { for (let k = 0; k < 3; k++) { out.data[d + k] = Math.round(out.data[d + k] * 0.8 + 255 * 0.2 * (k === 2 ? 1 : 0.6)); } }
        }
    }
    // retângulo vermelho da área marcada
    const rx0 = (m.x - x0) * Z, ry0 = (m.y - y0) * Z, rx1 = (m.x - x0 + m.w) * Z - 1, ry1 = (m.y - y0 + m.h) * Z - 1;
    const red = (x, y) => { if (x < 0 || y < 0 || x >= out.width || y >= out.height) { return; } const d = (y * out.width + x) * 4; out.data[d] = 255; out.data[d + 1] = 60; out.data[d + 2] = 60; };
    for (let t = 0; t < 2; t++) {
        for (let x = rx0; x <= rx1; x++) { red(x, ry0 + t); red(x, ry1 - t); }
        for (let y = ry0; y <= ry1; y++) { red(rx0 + t, y); red(rx1 - t, y); }
    }
    return out;
}

function side (a, b, gap = 12) {
    const out = new PNG({ width: a.width + b.width + gap, height: Math.max(a.height, b.height) });
    out.data.fill(20);
    for (let i = 3; i < out.data.length; i += 4) { out.data[i] = 255; }
    PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
    PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + gap, 0);
    return out;
}

const atual = crop(path.join(ROOT, rev.arquivo));
const antes = opt('--antes', null);
const img = antes ? side(crop(path.resolve(ROOT, antes)), atual) : atual;
const dir = path.join(ROOT, 'tools', 'revisor', 'recortes');
fs.mkdirSync(dir, { recursive: true });
const outFile = path.join(dir, `${sprite}-m${n}${antes ? '-antes-depois' : ''}.png`);
fs.writeFileSync(outFile, PNG.sync.write(img));
console.log(`#${n} [${m.prioridade}] ${m.categoria}: ${m.comentario}`);
console.log(`✓ ${path.relative(ROOT, outFile)}${antes ? '  (esquerda = antes, direita = depois)' : ''}`);
