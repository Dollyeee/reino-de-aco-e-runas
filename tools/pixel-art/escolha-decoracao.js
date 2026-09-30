// Página tools/pixel-art/escolha-decoracao.html (T15) — gerada por `npm run pixel`.
// Os 3 kits aplicados no MAPA INTEIRO lado a lado (mesmas posições de src/data/map01.js, chão novo, orcs no
// caminho) e, embaixo, os itens soltos de cada kit no tamanho real e ampliados 4×.
// As imagens são referenciadas por caminho relativo (public/assets/ e tools/pixel-art/decoracao/), não embutidas.

export function escolhaDecoracaoHtml ({ kits, items, grass }) {
    const maps = kits.map((k) => `
      <figure class="map"><a href="decoracao/mapa-${k.id}.png"><img src="decoracao/mapa-${k.id}.png" alt="Kit ${k.id.toUpperCase()}"></a>
        <figcaption><b>Kit ${k.id.toUpperCase()} — ${k.name}</b><br>${k.note}</figcaption></figure>`).join('');
    const full = kits.map((k) => `
      <h3>Kit ${k.id.toUpperCase()} — ${k.name} (tamanho real)</h3>
      <img class="real" src="decoracao/mapa-${k.id}.png" alt="Kit ${k.id.toUpperCase()} no mapa">`).join('');
    const loose = kits.map((k) => `
    <section>
      <h2>Kit ${k.id.toUpperCase()} — ${k.name}: itens soltos</h2>
      <div class="row">${items.map((it) => {
        const d = k.items[it];
        const src = `../../public/assets/decor-${k.id}-${it}.png`;
        return `
        <figure class="item"><div class="pair">
          <img src="${src}" style="width:${d.frame[0]}px" alt="${d.label}">
          <img src="${src}" style="width:${d.frame[0] * 4}px" alt="${d.label} 4×">
        </div><figcaption>${it} · ${d.label} · ${d.frame[0]}×${d.frame[1]}</figcaption></figure>`;
    }).join('')}
      </div>
    </section>`).join('');

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Decoração — escolha do kit</title>
<style>
  body { margin: 0; padding: 24px; background: #14100d; color: #f1e6cf; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 28px 0 8px; color: #c8fdff; } h3 { font-size: 14px; margin: 18px 0 6px; }
  p { margin: 0 0 12px; color: #b8a8a0; } code { color: #c8fdff; }
  img { image-rendering: pixelated; display: block; }
  .maps { display: flex; gap: 12px; align-items: flex-start; }
  .map { margin: 0; flex: 1 1 0; min-width: 0; } .map img { width: 100%; border: 1px solid #2a1f18; }
  figcaption { font-size: 12px; color: #b8a8a0; margin-top: 4px; }
  .real { border: 1px solid #2a1f18; max-width: none; }
  .row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
  .item { margin: 0; } .pair { display: flex; gap: 10px; align-items: flex-end; background: ${grass}; padding: 8px; border: 1px solid #2a1f18; }
</style>
</head>
<body>
<h1>Decoração — 3 kits para escolher</h1>
<p>Gerado por <code>npm run pixel</code>. Cada kit forçado no mapa inteiro, nas mesmas posições de decoração de <code>src/data/map01.js</code>,
sobre o chão novo, com orcs no caminho e o castelo como placeholder. <b>Escolha feita na T18</b>: mapa 1 = kit A com transição para o kit C
perto do castelo (veja <code>tools/pixel-art/cena-referencia.png</code>); kit B guardado para um mapa futuro. Para ver um kit inteiro no jogo:
<code>?decor=a</code>, <code>?decor=b</code> ou <code>?decor=c</code> na URL.</p>
<h2>Mapa inteiro — lado a lado (clique para abrir no tamanho real)</h2>
<div class="maps">${maps}
</div>
${full}
${loose}
</body>
</html>
`;
}
