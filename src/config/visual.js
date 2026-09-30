// Configuração visual (não é balanceamento): cores, camadas, luzes e pós-processamento.

// Tamanho lógico do mundo. Toda a lógica usa estas coordenadas.
export const WORLD = { width: 1280, height: 720 };

// Resolução interna = WORLD × RENDER_SCALE. As câmeras dão zoom para caber no mundo.
// Pixel art pede zoom INTEIRO (1, 2, 3): cada pixel da arte vira um bloco exato de pixels da tela.
function pickRenderScale () {
    const dpr = window.devicePixelRatio || 1;
    const screenH = Math.min(window.innerHeight, window.innerWidth * WORLD.height / WORLD.width) * dpr;
    return Math.min(3, Math.max(1, Math.floor(screenH / WORLD.height + 0.15)));
}
export const RENDER_SCALE = pickRenderScale();

// Pixel art: 1 pixel da arte = PIXEL_SCALE × PIXEL_SCALE pixels do mundo 1280×720.
export const PIXEL_SCALE = 2;

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
    // intensidades moderadas: luz só nos brilhos, sem "lavar" a pixel art
    coreLight: { radius: 300, color: 0x3ff5ff, intensity: 0.5 },
    crystalLight: { radius: 150, color: 0x3ff5ff, intensity: 0.55 },
    boltLight: { radius: 90, color: 0x3ff5ff, intensity: 0.85 },
    plasmaLight: { radius: 130, color: 0x7afcff, intensity: 0.85 },
    explosionLight: { radius: 220, color: 0xffb35a, intensity: 1.5 },
    muzzleLight: { radius: 110, color: 0x3ff5ff, intensity: 1.1 }
};

export const POSTFX = {
    bloom: {
        threshold: 0.9,         // só os brilhos (olho, plasma, cristais) vazam luz
        blurRadius: 2,
        blurSteps: 4,
        blurQuality: 1,
        blendAmount: 0.45       // fraco, para não borrar a pixel art
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
    eyeGlowSize: 12,        // halo do olho robótico
    // sprites de pixel art com animação (sprite sheet)
    walkCycle: 44,          // px do mundo andados por ciclo completo da caminhada (define o frameRate)
    knockback: 1,           // recuo ao levar dano, em pixels da ARTE (inteiro)
    knockbackMs: 90,
    pixelDeath: { blinks: 3, blinkMs: 70, sinkPx: 2 },  // morte em pixel art: pisca e afunda (px da arte)
    spawnMs: 300,
    death: {
        tipAngle: 1.35,     // tombo para frente (rad, ~77°)
        fallMs: 300,
        impactMs: 90,
        dissolveDelay: 140,
        dissolveMs: 260
    }
};

// Materialização rúnica (construção de torre). As fases são frações da duração total
// (BALANCE.towers.buildTime); entre parênteses, os tempos com a duração padrão de 0,9 s.
export const BUILD_FX = {
    runes: [0.00, 0.28],        // (0–0,25 s) círculo de runas surge girando + luz no centro
    base: [0.22, 0.61],         // (0,2–0,55 s) base revelada de baixo para cima em holograma
    snap: [0.56, 0.89],         // (0,5–0,8 s) peças de cima descem e encaixam
    finale: [0.89, 1.00],       // (0,8–0,9 s) flash, faíscas, luz apaga, runas somem
    color: 0x3ff5ff,
    hologramAlpha: 0.6,
    runeRadius: 64,             // raio do círculo de runas (px lógicos)
    runeFlatten: 0.42,          // achatamento 3/4 do círculo no chão
    runeSpin: 3.2,              // voltas (rad) que o círculo gira durante a construção
    light: { radius: 170, intensity: 1.6 },
    scanLag: 18,                // px de holograma entre a linha de varredura e a arte já sólida
    scanWidth: 1.15,            // largura da linha de varredura (× largura da base)
    snapLift: 26,               // px acima do encaixe onde a peça de cima surge
    squash: 0.06,               // squash da torre inteira no encaixe
    sparks: 8,
    flashSize: 120
};

// Deslocamento da sombra projetada (luz vem do canto superior esquerdo).
export const SHADOW = { offsetX: 7, offsetY: 4, alpha: 0.28 };

// Posições fixas do HUD (coordenadas do mundo; a UIScene usa a mesma câmera).
export const HUD = {
    panel: { x: 14, y: 12, w: 470, h: 60 },
    ether: { x: 50, y: 42 },
    core: { x: 178, y: 42 },
    wave: { x: 356, y: 42 },
    waveButton: { x: 1138, y: 44, w: 236, h: 54 }
};

// Barra de torres fixa na parte de baixo da tela.
export const TOWER_BAR = { x: 640, y: 670, cardW: 172, cardH: 76, gap: 12, pad: 10 };
