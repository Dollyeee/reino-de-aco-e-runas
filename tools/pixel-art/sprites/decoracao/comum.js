// Peças comuns da decoração (T15): copas irregulares, camadas de pinheiro, arbustos espinhosos, cristais.
// Cada item é desenhado no quadro definido em src/config/decor.js, com a base na penúltima linha
// (a última linha é o contorno externo, que encosta no chão — igual aos pés do orc).

import { PixelCanvas } from '../../lib/PixelCanvas.js';
import { hash, seedOf } from '../../lib/textures.js';

// origin: deslocamento de todas as formas (margem em volta da arte sem mudar as coordenadas do desenho)
export function canvasFor (def, origin = [0, 0]) {
    return new PixelCanvas(def.frame[0], def.frame[1], { origin });
}

// Máscara de copa/moita: elipse + lóbulos em volta da borda (silhueta irregular, sem forma de pirulito).
export function lumpy (m, cx, cy, rx, ry, n, seed, size = 0.4) {
    m.ellipse(cx, cy, rx, ry);
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (hash(i, 1, seed) - 0.5) * 0.8;
        const lr = Math.min(rx, ry) * (size + hash(i, 2, seed) * 0.25);
        m.ellipse(cx + Math.cos(a) * (rx - lr * 0.5), cy + Math.sin(a) * (ry - lr * 0.5), lr, lr * 0.85);
    }
    return m;
}

// Copa em tufos: cada tufo é uma parte (luz e contorno interno próprios), de trás para frente.
// blobs = [[cx, cy, rx, ry, lóbulos], ...]
export function canopy (cv, mat, name, blobs) {
    blobs.forEach(([cx, cy, rx, ry, n], i) => {
        cv.part(mat, (m) => lumpy(m, cx, cy, rx, ry, n, seedOf(`${name}${i}`)), { name: `${name} ${i}` });
    });
}

// Camada de pinheiro: triângulo com a borda de baixo recortada em pontas caídas.
export function tier (m, cx, top, bottom, hw, seed) {
    const n = Math.max(4, Math.round(hw / 4));
    const pts = [[cx, top], [cx + hw, bottom]];
    for (let k = 1; k < n; k++) {
        const x = cx + hw - (2 * hw * k) / n;
        const y = bottom - (k % 2 ? 3 + Math.round(hash(k, 0, seed) * 2) : Math.round(hash(k, 1, seed) * 2));
        pts.push([x, y]);
    }
    pts.push([cx - hw, bottom]);
    return m.poly(pts);
}

// Arbusto espinhoso: meia-estrela achatada (pontas alternando raio longo e curto) sobre base reta.
export function spiky (m, cx, baseY, rx, ry, n, seed) {
    const pts = [[cx + rx, baseY]];
    for (let i = 0; i <= n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI;
        const r = i % 2 ? 0.62 + hash(i, 0, seed) * 0.12 : 0.95 + hash(i, 1, seed) * 0.08;
        pts.push([cx + Math.cos(a) * rx * r, baseY - Math.sin(a) * ry * r]);
    }
    pts.push([cx - rx, baseY]);
    return m.poly(pts);
}

// Fragmento de cristal: corpo (rampa 'cristal', 1 px de brilho) + veio emissivo ciano no meio.
export function shard (cv, pts, vein, name) {
    cv.part('cristal', (m) => m.poly(pts), { name, specular: 1 });
    if (vein) { cv.emissive('ciano', (m) => m.line(...vein), { halo: 0, core: 3 }); }
}

// Sulco gravado (tom 0 do material, 3 px) com linha emissiva ciano de 1 px por cima: runas, fissuras, circuitos.
// segs = [[x0, y0, x1, y1], ...]
export function runeGroove (cv, mat, segs, width = 3) {
    cv.paint({ mat, tone: 0 }, (m) => { for (const s of segs) { m.line(...s, width); } });
    cv.emissive('ciano', (m) => { for (const s of segs) { m.line(...s); } }, { halo: 0, core: 3 });
}

// Pontos emissivos soltos (brilhos rúnicos em copas e moitas).
export function glints (cv, pts) {
    cv.emissive('ciano', (m) => { for (const [x, y] of pts) { m.px(x, y); } }, { halo: 0, core: 3 });
}

// Musgo por cima de uma pedra (só onde já existe pedra): miolo claro em cima/esquerda e folhinhas escuras.
export function mossCap (cv, cx, cy, rx, ry, seed = 1) {
    cv.paint({ mat: 'musgo', tone: 2 }, (m) => m.ellipse(cx, cy, rx, ry));
    cv.paint({ mat: 'musgo', tone: 3 }, (m) => m.ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.5, ry * 0.45));
    cv.paint({ mat: 'musgo', tone: 1 }, (m) => {
        for (let i = 0; i < Math.round(rx); i++) {
            const x = cx - rx + hash(i, 0, seed) * rx * 2, y = cy + ry * 0.6 - hash(i, 1, seed) * ry;
            m.px(Math.round(x), Math.round(y));
        }
    });
}

// Faceta de pedra angulosa: pinta um polígono num tom (só sobre a pedra já desenhada).
export function facet (cv, mat, tone, pts) {
    cv.paint({ mat, tone }, (m) => m.poly(pts));
}
