// Ruído determinístico para o cenário (semente fixa → o mesmo mapa sempre).
import { hash } from './textures.js';

const smooth = (t) => t * t * (3 - 2 * t);

// Ruído de valor 2D em [0, 1): grade de `cell` px com interpolação suave.
export function valueNoise (x, y, cell, seed = 0) {
    const gx = x / cell, gy = y / cell;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = smooth(gx - x0), fy = smooth(gy - y0);
    const a = hash(x0, y0, seed), b = hash(x0 + 1, y0, seed);
    const c = hash(x0, y0 + 1, seed), d = hash(x0 + 1, y0 + 1, seed);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

// Ruído de valor 1D em [0, 1) (bordas irregulares ao longo do caminho).
export function valueNoise1 (s, cell, seed = 0) {
    const g = s / cell, i = Math.floor(g), f = smooth(g - i);
    const a = hash(i, 0, seed), b = hash(i + 1, 0, seed);
    return a + (b - a) * f;
}

// Duas oitavas (manchas grandes com borda mais recortada).
export function fbm (x, y, cell, seed = 0) {
    return valueNoise(x, y, cell, seed) * 0.7 + valueNoise(x, y, cell / 3, seed + 17) * 0.3;
}
