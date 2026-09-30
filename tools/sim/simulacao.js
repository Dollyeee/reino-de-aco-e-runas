// ============================================================================
//  Simulação de balanceamento — roda dentro do jogo, no navegador.
//
//  Com `npm run dev` aberto, no console do navegador:
//      const { simular } = await import('/tools/sim/simulacao.js');
//      await simular(window.__game);
//  Recarregue a página antes de cada simulação (rodar duas vezes na mesma página repete UUIDs de textura).
//
//  Um robô constrói torres nos pontos que mais cobrem o caminho (as curvas em U), gasta todo o éter
//  em cada fase de construção e inicia a próxima onda. Três estratégias: mista (Besta e Catapulta
//  alternadas), só Bestas e só Catapultas. Resultado = vida do Núcleo no fim (ex.: 16/20).
//
//  Determinística: Math.random com semente fixa, Date.now virtual (os tweens do Phaser usam o relógio
//  real) e passos fixos de 1/60 s sem renderizar. A "assinatura" é um hash da vida dos inimigos a cada
//  quadro: se duas versões do código dão a mesma assinatura, o jogo se comportou exatamente igual.
// ============================================================================

import { BALANCE } from '/src/config/balance.js';
import PlacementRules from '/src/world/PlacementRules.js';

const DT = 1000 / 60;
const GRID = 10;                 // espaçamento dos pontos candidatos (px)
const PATH_STEP = 8;             // amostragem do caminho para medir cobertura (px)
const MAX_FRAMES = 60 * 60 * 20; // limite de segurança (20 min de jogo)

const STRATEGIES = {
    mista: ['laserCrossbow', 'plasmaCatapult'],
    bestas: ['laserCrossbow'],
    catapultas: ['plasmaCatapult']
};

function mulberry32 (seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Pontos candidatos de cada tipo de torre, do que mais cobre o caminho para o que menos cobre.
function rankSpots (scene, type) {
    const s = BALANCE.towers[type];
    const track = scene.track;
    const samples = [];
    for (let d = 0; d <= track.length; d += PATH_STEP) {
        const p = track.getPointAt(d);
        if (p.x >= 0 && p.x <= 1280) { samples.push(p); }
    }
    const rules = new PlacementRules(scene.map, track);
    const spots = [];
    for (let y = GRID; y < 720; y += GRID) {
        for (let x = GRID; x < 1280; x += GRID) {
            if (!rules.check(type, x, y, []).ok) { continue; }
            let score = 0;
            for (const p of samples) {
                const d = Math.hypot(p.x - x, p.y - y);
                if (d <= s.range && d >= (s.minRange || 0)) { score++; }
            }
            spots.push({ x, y, score });
        }
    }
    spots.sort((a, b) => b.score - a.score || a.y - b.y || a.x - b.x);
    return { rules, spots };
}

async function runStrategy (game, name, seed) {
    const order = STRATEGIES[name];
    let scene = game.scene.getScene('GameScene');
    let t = 0;
    const step = () => { t += DT; game.headlessStep(t, DT); };

    // semente própria por estratégia (repetir a mesma sequência geraria UUIDs de textura repetidos)
    let h = seed;
    for (const ch of name) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); }
    Math.random = mulberry32(h);
    scene.scene.stop('ResultScene');
    scene.scene.restart();
    for (let i = 0; i < 5; i++) { step(); }
    scene = game.scene.getScene('GameScene');

    const ranked = {};
    for (const type of new Set(order)) { ranked[type] = rankSpots(scene, type); }

    let next = 0;
    let hash = 0;
    const coreByWave = [];
    const built = [];

    const buildAll = () => {
        for (;;) {
            const type = order[next % order.length];
            if (scene.state.ether < BALANCE.towers[type].cost) { return; }
            const { rules, spots } = ranked[type];
            const spot = spots.find((p) => rules.check(type, p.x, p.y, scene.towers).ok);
            if (!spot) { return; }
            scene.buildTower(type, spot.x, spot.y);
            built.push(`${type === 'laserCrossbow' ? 'B' : 'C'}(${spot.x},${spot.y})`);
            next++;
        }
    };

    let frames = 0;
    while (frames < MAX_FRAMES) {
        const ph = scene.state.phase;
        if (ph === 'victory' || ph === 'defeat') { break; }
        if (ph === 'build') {
            if (scene.state.wave > 0) { coreByWave.push(scene.state.coreHealth); }
            buildAll();
            // espera as torres novas terminarem a materialização antes de chamar a onda
            for (let i = 0; i < 60; i++) { step(); frames++; }
            scene.startWave();
        }
        step();
        frames++;
        let hp = 0;
        for (const e of scene.enemies) { hp += e.alive ? e.health : 0; }
        hash = (Math.imul(hash, 31) + Math.round(hp * 100) + scene.enemies.length * 7 + scene.state.coreHealth) >>> 0;
    }
    coreByWave.push(scene.state.coreHealth);

    return {
        estrategia: name,
        resultado: scene.state.phase === 'victory' ? `${scene.state.coreHealth}/${scene.state.coreMax}` : 'perde',
        onda: scene.state.wave,
        nucleoPorOnda: coreByWave.join(' '),
        eterFinal: scene.state.ether,
        torres: built.join(' '),
        quadros: frames,
        assinatura: hash.toString(16)
    };
}

export async function simular (game, { estrategias = Object.keys(STRATEGIES), seed = 1 } = {}) {
    if (window.__simulou) { throw new Error('Recarregue a página antes de simular de novo.'); }
    window.__simulou = true;
    const realRandom = Math.random;
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    game.loop.sleep();
    // Date.now anda junto com os passos fixos (tweens do Phaser dependem dele)
    const headless = game.headlessStep.bind(game);
    game.headlessStep = (time, delta) => { now += delta; headless(time, delta); };

    const results = [];
    try {
        for (const name of estrategias) {
            results.push(await runStrategy(game, name, seed));
        }
    } finally {
        delete game.headlessStep;
        Math.random = realRandom;
        Date.now = realNow;
        game.loop.wake();
    }
    console.table(results);
    return results;
}
