// Texturas por material, com semente fixa.
// Cada função recebe coordenadas LOCAIS da parte (relativas ao canto do seu retângulo), então o padrão
// acompanha a parte quando ela se desloca na animação e não "ferve" entre quadros.
// Retornam o ajuste de tom (-1, 0, +1) ou { color } para pintar uma cor avulsa (ex.: ferrugem).

import { SINGLE } from '../palette.js';

// hash inteiro determinístico → [0, 1)
export function hash (x, y, seed = 0) {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

export function seedOf (name = '') {
    let s = 7;
    for (let i = 0; i < name.length; i++) { s = (Math.imul(s, 31) + name.charCodeAt(i)) | 0; }
    return s;
}

// p = { lx, ly, tone, edge (distância até a borda da parte: 0 = na borda), seed }
export const TEXTURES = {
    // aço escovado: riscos horizontais sutis (tracejados) — claros sobre o tom médio, escuros sobre o claro
    aco (p) {
        if (p.ly % 3 === 1 && hash(p.lx >> 2, p.ly, p.seed) < 0.45) { return p.tone === 2 ? +1 : (p.tone === 3 ? -1 : 0); }
        return 0;
    },
    acoClaro (p) {
        if (p.ly % 4 === 1 && hash(p.lx >> 2, p.ly, p.seed) < 0.45) { return p.tone === 2 ? +1 : (p.tone === 3 ? -1 : 0); }
        return 0;
    },
    // couro: ruído leve entre os tons médio e claro
    couro (p) {
        const h = hash(p.lx, p.ly, p.seed);
        if (h < 0.14 && p.tone === 3) { return -1; }
        if (h > 0.9 && p.tone === 2) { return +1; }
        return 0;
    },
    // tecido: trama discreta
    tecido (p) {
        if ((p.lx + p.ly) % 4 === 0 && hash(p.lx, p.ly, p.seed) < 0.35) { return p.tone === 3 ? -1 : (p.tone === 2 ? +1 : 0); }
        return 0;
    },
    // pele: poucos pixels de volume muscular (brilhos pequenos nos tons médios)
    pele (p) {
        if (p.tone === 2 && p.edge >= 2 && hash(p.lx, p.ly, p.seed) < 0.035) { return +1; }
        return 0;
    }
};

// variações de pele usam a mesma textura
TEXTURES.peleOliva = TEXTURES.pele;
TEXTURES.peleClara = TEXTURES.pele;
TEXTURES.peleCinza = TEXTURES.pele;

// Ferrugem: manchas nas bordas das placas de aço.
export function rust (p, amount = 0.12) {
    if (p.edge <= 1 && hash(p.lx * 3, p.ly * 5, p.seed + 11) < amount) {
        return { color: hash(p.lx, p.ly, p.seed + 3) < 0.5 ? SINGLE.ferrugem : SINGLE.ferrugemEscura };
    }
    return null;
}
