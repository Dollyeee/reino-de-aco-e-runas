// Página de escolha entre versões de um sprite (hoje: Orc Cibernético, T09) — gerada por `npm run pixel`.
// Mostra cada versão parada e andando em loop, no tamanho real do jogo (grama e terra) e ampliada 4×,
// e 2 inimigos de cada versão andando juntos sobre o caminho, como numa onda.

// variants: [{ id, label, note, walk: {base64, frames}, idle: {base64}, fw, fh, pivot, walkCycle, shadow }]
export function escolhaHtml ({ title, variants, speed, grass, dirt }) {
    const data = Object.fromEntries(variants.map((v) => [v.id, {
        walk: `data:image/png;base64,${v.walk.base64}`, idle: `data:image/png;base64,${v.idle.base64}`,
        frames: v.walk.frames, fw: v.fw, fh: v.fh, pivot: v.pivot, walkCycle: v.walkCycle, shadow: v.shadow
    }]));
    const cell = (v, mode, scale, bg, cap) =>
        `<figure><canvas data-v="${v.id}" data-mode="${mode}" data-scale="${scale}" data-bg="${bg}"></canvas><figcaption>${cap}</figcaption></figure>`;
    const cols = variants.map((v) => `
      <div class="col">
        <h3>${v.label}</h3>
        <p class="note">${v.note}</p>
        <div class="row">
          ${cell(v, 'idle', 1, grass, 'parado · grama')}
          ${cell(v, 'walk', 1, grass, 'andando · grama')}
        </div>
        <div class="row">
          ${cell(v, 'idle', 1, dirt, 'parado · terra')}
          ${cell(v, 'walk', 1, dirt, 'andando · terra')}
        </div>
      </div>`).join('\n');
    const zoom = variants.map((v) => `
      <div class="col">
        <h3>${v.label}</h3>
        <div class="row">
          ${cell(v, 'idle', 4, grass, 'parado · 4×')}
          ${cell(v, 'walk', 4, grass, 'andando · 4×')}
        </div>
      </div>`).join('\n');
    const waves = variants.map((v) => `
      <figure><canvas class="path" data-v="${v.id}" data-mode="path" width="520" height="150"></canvas><figcaption>${v.label} — 2 na onda, tamanho real, velocidade do jogo (${speed} px/s)</figcaption></figure>`).join('\n');

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { margin: 0; padding: 24px; background: #14100d; color: #f1e6cf; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 28px 0 10px; color: #c8fdff; }
  h3 { font-size: 14px; margin: 0 0 4px; color: #ffd9a0; }
  p { margin: 0 0 12px; color: #b8a8a0; } .note { font-size: 12px; max-width: 300px; min-height: 34px; }
  .cols { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 8px; }
  figure { margin: 0; } figcaption { font-size: 11px; color: #b8a8a0; margin-top: 3px; }
  canvas { image-rendering: pixelated; display: block; border: 1px solid #2a1f18; }
  .paths { display: flex; flex-wrap: wrap; gap: 18px; }
  code { color: #c8fdff; }
</style>
</head>
<body>
<h1>${title}</h1>
<p>Gerado por <code>npm run pixel</code>. Caminhada em loop na cadência do jogo (um ciclo a cada <code>walkCycle</code> px andados a ${speed} px/s).
Para testar no jogo: <code>ORC_VARIANT</code> em <code>src/config/art.js</code>, ou abra o jogo com <code>?orc=a</code> / <code>b</code> / <code>c</code> / <code>atual</code>.</p>

<h2>Tamanho real do jogo</h2>
<div class="cols">${cols}</div>

<h2>Ampliado 4×</h2>
<div class="cols">${zoom}</div>

<h2>No caminho, como numa onda</h2>
<div class="paths">${waves}</div>

<script>
const DATA = ${JSON.stringify(data)};
const SPEED = ${speed};
const GRASS = '${grass}', DIRT = '${dirt}';
const img = (src) => { const i = new Image(); i.src = src; return i; };
for (const d of Object.values(DATA)) { d.walkImg = img(d.walk); d.idleImg = img(d.idle); }
const canvases = [...document.querySelectorAll('canvas')];
const PAD = 4;

function frameAt (d, dist) { return Math.floor(dist / d.walkCycle * d.frames) % d.frames; }

// sombra de pixels duros (elipse), como no jogo
function shadow (ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.32)';
  const rx = w / 2, ry = h / 2;
  for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) {
    for (let i = -Math.ceil(rx); i <= Math.ceil(rx); i++) {
      if ((i + 0.5) * (i + 0.5) / (rx * rx) + (j + 0.5) * (j + 0.5) / (ry * ry) <= 1) { ctx.fillRect(x + i + 3, y + j + 1, 1, 1); }
    }
  }
}

function setup () {
  for (const cv of canvases) {
    if (cv.dataset.mode === 'path') { continue; }
    const d = DATA[cv.dataset.v], s = +cv.dataset.scale;
    cv.width = (d.fw + PAD * 2) * s;
    cv.height = (d.fh + PAD * 2) * s;
  }
}

function drawPath (cv, d, t) {
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = GRASS; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = DIRT; ctx.fillRect(0, 88, cv.width, 52);
  ctx.fillStyle = 'rgba(40, 26, 16, 0.25)'; ctx.fillRect(0, 88, cv.width, 2); ctx.fillRect(0, 138, cv.width, 2);
  const span = cv.width + d.fw * 2;
  const base = (t * SPEED / 1000) % span;
  // dois orcs: o de trás um pouco acima e atrás (sobrepostos, como na onda)
  const orcs = [{ lag: 34, y: 116, phase: 3 }, { lag: 0, y: 128, phase: 0 }];
  for (const o of orcs) {
    const dist = base - o.lag;
    const x = Math.round(dist - d.fw);
    shadow(ctx, x, o.y, d.shadow[0], d.shadow[1]);
  }
  for (const o of orcs) {
    const dist = base - o.lag;
    const x = Math.round(dist - d.fw);
    const f = (frameAt(d, Math.max(0, dist)) + o.phase) % d.frames;
    ctx.drawImage(d.walkImg, f * d.fw, 0, d.fw, d.fh, x - d.pivot[0], o.y - d.pivot[1], d.fw, d.fh);
  }
}

function draw (t) {
  for (const cv of canvases) {
    const d = DATA[cv.dataset.v];
    if (cv.dataset.mode === 'path') { drawPath(cv, d, t); continue; }
    const s = +cv.dataset.scale;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = cv.dataset.bg;
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (cv.dataset.mode === 'idle') {
      ctx.drawImage(d.idleImg, 0, 0, d.fw, d.fh, PAD * s, PAD * s, d.fw * s, d.fh * s);
    } else {
      const f = frameAt(d, t * SPEED / 1000);
      ctx.drawImage(d.walkImg, f * d.fw, 0, d.fw, d.fh, PAD * s, PAD * s, d.fw * s, d.fh * s);
    }
  }
}

Promise.all(Object.values(DATA).flatMap((d) => [d.walkImg.decode(), d.idleImg.decode()])).then(() => {
  setup();
  const t0 = performance.now();
  const loop = () => { draw(performance.now() - t0); requestAnimationFrame(loop); };
  loop();
});
</script>
</body>
</html>
`;
}
