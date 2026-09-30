// Configuração visual (não é balanceamento): cores, camadas, luzes e pós-processamento.

// Tamanho lógico do mundo. Toda a lógica usa estas coordenadas.
export const WORLD = { width: 1280, height: 720 };

// Resolução interna = WORLD × RENDER_SCALE. As câmeras dão zoom para caber no mundo,
// então sprites e textos ficam nítidos em telas grandes / alta densidade.
function pickRenderScale () {
    const dpr = window.devicePixelRatio || 1;
    const screenH = Math.max(window.innerHeight, window.innerWidth * WORLD.height / WORLD.width) * dpr;
    const ideal = Math.round((screenH / WORLD.height) * 2) / 2;
    return Math.min(2, Math.max(1, ideal));
}
export const RENDER_SCALE = pickRenderScale();

// Tipografia: Cinzel para títulos/nomes, Oxanium para HUD, custos e números de dano.
export const FONT = '"Cinzel", Georgia, serif';
export const FONT_NUMBERS = '"Oxanium", "Trebuchet MS", sans-serif';

// Camadas de profundidade. Objetos do mundo usam DEPTH.OBJECTS + y.
export const DEPTH = {
    GROUND: 0,
    DECAL: 5,
    SHADOW: 10,
    RANGE: 20,
    OBJECTS: 100,       // + y do objeto (0..720)
    FLYING: 900,        // projéteis em arco usam OBJECTS + y do chão + altura; este é o mínimo "no ar"
    FX: 2000,
    FLOATING_TEXT: 3000
};

export const COLORS = {
    outline: 0x1e1512,          // contorno marrom-escuro quente
    cyan: 0x3ff5ff,
    cyanDeep: 0x13b6d6,
    cyanPale: 0xc8fdff,
    plasma: 0x7afcff,
    ether: 0x5ef0ff,
    orange: 0xffa53a,
    red: 0xff3b4e,
    white: 0xffffff,
    gold: 0xffd34d,

    // Mundo: dessaturado e mais escuro (musgo, pedra fria, terra batida)
    grass: 0x677444,
    grassDark: 0x535d38,
    grassLight: 0x7a8651,
    grassBlade: 0x39432a,
    dirtOutline: 0x2a1d15,
    dirt: 0x96795a,
    dirtDark: 0x745c42,
    dirtLight: 0xab8f6c,
    stone: 0x7b7a76,
    stoneLight: 0x939089,
    flowers: [0xb9b29a, 0xa79a6e, 0x8f8578],

    uiPanel: 0x2b1d33,
    uiPanelLight: 0x44305a,
    uiText: 0xfff6e6
};

export const LIGHTING = {
    ambient: 0xc4b4a8,          // luz ambiente de fim de tarde (multiplica tudo que tem setLighting)
    maxLights: 40,              // limite de luzes visíveis ao mesmo tempo
    coreLight: { radius: 300, color: 0x3ff5ff, intensity: 0.7 },
    crystalLight: { radius: 150, color: 0x3ff5ff, intensity: 0.8 },
    boltLight: { radius: 90, color: 0x3ff5ff, intensity: 1.2 },
    plasmaLight: { radius: 130, color: 0x7afcff, intensity: 1.2 },
    explosionLight: { radius: 220, color: 0xffb35a, intensity: 2.2 },
    muzzleLight: { radius: 110, color: 0x3ff5ff, intensity: 1.6 }
};

export const POSTFX = {
    bloom: {
        threshold: 0.86,        // só cores muito claras brilham (por canal: ciano/branco sim, grama não)
        blurRadius: 3,
        blurSteps: 4,
        blurQuality: 1,
        blendAmount: 0.7
    },
    // Vinheta do Phaser 4: mistura cresce do centro até `radius`; strength baixo = sutil.
    vignette: { radius: 0.85, strength: 0.13, color: 0x1e1512 }
};

// Animação dos inimigos ("cartoon sério": passo pesado, deformação contida).
export const ENEMY_ANIM = {
    stepRate: 0.1,          // cadência: radianos de ciclo por pixel andado
    stepBob: 3,             // quanto o corpo sobe entre um passo e outro (px)
    stepSquash: 0.05,       // achatamento no impacto do pé no chão
    sway: 0.03,             // balanço lateral (rad) alternando a cada passo
    dustChance: 0.35,       // chance de levantar poeira a cada passo
    hitSquash: 0.08,        // tranco ao levar dano
    hitRecover: 7,          // velocidade de recuperação do tranco (por segundo)
    hitTilt: 0.05,          // inclinação para trás ao levar dano (rad)
    eyeGlowSize: 16,        // halo do olho robótico
    spawnMs: 300,
    death: {
        tipAngle: 1.35,     // tombo para frente (rad, ~77°)
        fallMs: 300,
        impactMs: 90,
        dissolveDelay: 140,
        dissolveMs: 260
    }
};

// Deslocamento da sombra projetada (luz vem do canto superior esquerdo).
export const SHADOW = { offsetX: 7, offsetY: 4, alpha: 0.28 };

// Posições fixas do HUD (coordenadas do mundo; a UIScene usa a mesma câmera).
export const HUD = {
    ether: { x: 50, y: 42 },
    core: { x: 178, y: 42 },
    wave: { x: 356, y: 42 },
    waveButton: { x: 1138, y: 44 }
};
