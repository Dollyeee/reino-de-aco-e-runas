// Página tools/pixel-art/escolha-torres.html (T19) — gerada por `npm run pixel`.
// As 3 versões de cada torre: paradas e animadas (materialização rúnica → mira com recuo / arremesso), no tamanho real
// sobre o chão do mapa ao lado de um orc e de peças do kit A, e ampliadas 4×. O script da página está em
// escolha-torres.client.js (embutido aqui); as imagens são referenciadas por caminho relativo (public/assets/).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A = '../../public/assets/';

// cena comum (recorte do chão do mapa 1 onde o caminho passa na horizontal, y = 560)
const SCENE = {
    w: 300, h: 230, crop: { x: 330, y: 390 }, pathY: 170, orcSpeed: 62,
    tower: { x: 150, y: 142 }, orcIdle: { x: 238 }
};

// uma célula (4 canvases) de uma versão de torre
function cell (id, title, d, kind) {
    return `
        <div class="col">
          <h3>${title}</h3>
          <p class="note">${d.note || ''}</p>
          ${d.upgrades ? `<p class="up"><b>Nível 3:</b> ${d.upgrades[3]}<br><b>Nível 4:</b> ${d.upgrades[4]}</p>` : ''}
          <div class="row">
            <figure><canvas data-tw="${id}" data-zoom="1" data-mode="still"></canvas><figcaption>parada (idle) · tamanho real</figcaption></figure>
            <figure><canvas data-tw="${id}" data-zoom="1" data-mode="anim"></canvas><figcaption>materialização + ${kind === 'besta' ? 'mira e recuo' : 'arremesso'} · tamanho real</figcaption></figure>
          </div>
          <div class="row">
            <figure><canvas data-tw="${id}" data-zoom="4" data-mode="anim"></canvas><figcaption>animada · 4×</figcaption></figure>
            <figure><canvas data-tw="${id}" data-zoom="4" data-mode="still"></canvas><figcaption>parada (idle) · 4×</figcaption></figure>
          </div>
        </div>`;
}

export function escolhaTorresHtml ({ towerArt, bestaAntes, headAngles, armAngles, buildFx, orc, decor }) {
    const towers = {};
    const cols = { laserCrossbow: [], plasmaCatapult: [] };
    const DEG = Math.PI / 180;
    const kinds = [['laserCrossbow', 'besta', 'head', 'cabeca', 'besta'], ['plasmaCatapult', 'catapulta', 'arm', 'braco', 'catapulta']];
    const entry = (d, kind, baseSrc, pieceSrc, pieceName) => {
        const P = d[pieceName];
        const topY = kind === 'besta' ? d.headMount.y - 30 : d.armPivot.y + d.orb.y * Math.cos(20 * DEG) - 10;
        const h = Math.max(d.base.frame[1], -Math.round(topY)) + 14;
        const w = kind === 'besta' ? 110 : 150;
        return {
            kind, name: d.name,
            base: { src: baseSrc, w: d.base.frame[0], h: d.base.frame[1], px: d.base.pivot[0], py: d.base.pivot[1], frames: d.base.frames || 1, fps: d.base.fps || 6 },
            piece: { src: pieceSrc, w: P.frame[0], h: P.frame[1], px: P.pivot[0], py: P.pivot[1], phases: P.phases || 1 },
            mount: d.headMount || d.armPivot, muzzle: d.muzzle, crystal: d.crystal, cup: d.cup, orb: d.orb,
            shadow: d.shadow, float: d.float || 0,
            rest: -0.35, windup: -0.85, throwA: 1.05,
            crop: { x: Math.round(SCENE.tower.x - w / 2), y: Math.max(0, SCENE.tower.y - h + 12), w, h: Math.min(h, SCENE.tower.y + 12) }
        };
    };
    // "Besta A antes × depois" (T20)
    towers['besta-a0'] = entry(bestaAntes, 'besta', 'torres/besta-a-antes-base.png', 'torres/besta-a-antes-cabeca.png', 'head');
    const antesDepois = cell('besta-a0', 'Antes (T19)', bestaAntes, 'besta') +
        cell('besta-a', 'Depois (T20) — passada de acabamento', towerArt.laserCrossbow.a, 'besta');
    // "Besta A atual × Besta nova" (T22): mesmas animações; ids próprios para não repetir as células de cima
    towers['besta-a-t22'] = entry(towerArt.laserCrossbow.a, 'besta', `${A}torre-besta-a-base.png`, `${A}torre-besta-a-cabeca.png`, 'head');
    towers['besta-n-t22'] = entry(towerArt.laserCrossbow.n, 'besta', `${A}torre-besta-n-base.png`, `${A}torre-besta-n-cabeca.png`, 'head');
    const novaTecnica = cell('besta-a-t22', 'Besta A atual (T20)', towerArt.laserCrossbow.a, 'besta') +
        cell('besta-n-t22', 'Besta nova (T22) — nova técnica', towerArt.laserCrossbow.n, 'besta');
    // T24: base atual da Besta nova × 3 bases novas
    const basesIds = ['n', 'n1', 'n2', 'n3'];
    for (const v of basesIds) {
        towers[`base-${v}`] = entry(towerArt.laserCrossbow[v], 'besta', `${A}torre-besta-${v}-base.png`, `${A}torre-besta-${v}-cabeca.png`, 'head');
    }
    const basesNovas = basesIds.map((v) => cell(`base-${v}`, `${v.toUpperCase()} — ${towerArt.laserCrossbow[v].name}${v === 'n' ? ' (base atual no jogo)' : ''}`, towerArt.laserCrossbow[v], 'besta')).join('');
    const rodadasBases = [
        ['bases-conceitos.png', '0 · conceito: 3 silhuetas (torreão · paliçada · altar)'],
        ['bases-r1.png', 'R1 · blocagem + luz e volume'],
        ['bases-r2.png', 'R2 · materiais e detalhes + correções da R1'],
        ['bases-r3.png', 'R3 · limpeza + correções da R2 — final']
    ].map(([f, cap]) => `<figure><img class="rod" src="rodadas/${f}" alt="${cap}"><figcaption>${cap}</figcaption></figure>`).join('');
    const rodadas = [
        ['besta-conceitos.png', '0 · conceito: 3 silhuetas (baixa e larga · robusta, escolhida · alta e estreita)'],
        ['besta-r1.png', 'R1 · blocagem + luz e volume (etapas 1–2)'],
        ['besta-r2.png', 'R2 · materiais e detalhes (etapa 3) + correções da R1'],
        ['besta-r3.png', 'R3 · limpeza (etapa 4) + correções da R2 — final']
    ].map(([f, cap]) => `<figure><img class="rod" src="rodadas/${f}" alt="${cap}"><figcaption>${cap}</figcaption></figure>`).join('');
    for (const [tower, file, pieceName, pieceFile, kind] of kinds) {
        for (const [v, d] of Object.entries(towerArt[tower])) {
            const id = `${file}-${v}`;
            towers[id] = entry(d, kind, `${A}torre-${file}-${v}-base.png`, `${A}torre-${file}-${v}-${pieceFile}.png`, pieceName);
            cols[tower].push(cell(id, `${v.toUpperCase()} — ${d.name}`, d, kind));
        }
    }
    const data = {
        towers, headAngles, armAngles, buildFx,
        scene: {
            ...SCENE, ground: `${A}chao-map01.png`,
            orc: { walk: `${A}orc-b-walk.png`, idle: `${A}orc-b.png`, ...orc },
            decor: decor.map((d) => ({ ...d, src: `${A}${d.file}` }))
        }
    };
    const client = fs.readFileSync(path.join(HERE, 'escolha-torres.client.js'), 'utf8');
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Torres — escolha das versões</title>
<style>
  body { margin: 0; padding: 24px; background: #14100d; color: #f1e6cf; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 28px 0 8px; color: #c8fdff; } h3 { font-size: 14px; margin: 0 0 4px; }
  p { margin: 0 0 10px; color: #b8a8a0; } code { color: #c8fdff; } .note { color: #d8c8b8; } .up { font-size: 12px; }
  .cols { display: flex; gap: 22px; align-items: flex-start; flex-wrap: wrap; } .col { flex: 0 0 auto; max-width: 1240px; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; } figure { margin: 0 0 10px; } figcaption { font-size: 12px; color: #b8a8a0; margin-top: 3px; }
  canvas { image-rendering: pixelated; display: block; border: 1px solid #2a1f18; }
  .rodadas { display: flex; flex-direction: column; gap: 6px; } .rod { image-rendering: pixelated; display: block; border: 1px solid #2a1f18; max-width: 100%; }
</style>
</head>
<body>
<h1>Torres em pixel art — 3 versões de cada</h1>
<p>Gerado por <code>npm run pixel</code>. Cenário real do mapa 1 (chão, kit A, orc Saqueador). A animação repete a cada 9 s: materialização rúnica,
depois combate. A peça de cima é redesenhada em cada ângulo (sem rotação de imagem) e o recuo é em pixels inteiros.
Para testar no jogo: <code>TOWER_VARIANT</code> em <code>src/config/art.js</code> ou <code>?besta=a&amp;catapulta=c</code> na URL (padrão <code>'atual'</code> = SVGs).</p>
<h2>Base da Besta — atual × 3 opções novas (T24)</h2>
<div class="cols">${basesNovas}
</div>
<h2>Rodadas das 3 bases (autocrítica em <code>tools/pixel-art/rodadas/bases-autocritica.md</code>)</h2>
<div class="rodadas">${rodadasBases}
</div>
<h2>Besta A atual × Besta nova (T22, nova técnica: peças desenhadas à mão, 4 etapas)</h2>
<div class="cols">${novaTecnica}
</div>
<h2>Rodadas da Besta nova (autocrítica em <code>tools/pixel-art/rodadas/besta-autocritica.md</code>)</h2>
<div class="rodadas">${rodadas}
</div>
<h2>Besta A — antes × depois (T20, passada de acabamento)</h2>
<div class="cols">${antesDepois}
</div>
<h2>Besta Laser</h2>
<div class="cols">${cols.laserCrossbow.join('')}
</div>
<h2>Catapulta de Plasma</h2>
<div class="cols">${cols.plasmaCatapult.join('')}
</div>
<script>const DATA = ${JSON.stringify(data)};</script>
<script>${client}</script>
</body>
</html>
`;
}
