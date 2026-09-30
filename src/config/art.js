// Manifesto de arte: cada SVG em public/assets/ e seus pontos de ancoragem.
// Ao trocar a arte por versões profissionais, ajuste apenas este arquivo
// (origem e pontos de encaixe, em pixels do SVG relativos à âncora).

export const ART = {
    'build-slot':           { file: 'build-slot.svg', origin: [0.5, 25 / 60] },

    'tower-crossbow-base':  { file: 'tower-crossbow-base.svg', origin: [0.5, 1], headMount: { x: 0, y: -61 } },
    'tower-crossbow-head':  { file: 'tower-crossbow-head.svg', origin: [0.5, 0.5], muzzle: { x: 54, y: 0 } },

    'tower-catapult-base':  { file: 'tower-catapult-base.svg', origin: [0.5, 1], armPivot: { x: 0, y: -52 } },
    'tower-catapult-arm':   { file: 'tower-catapult-arm.svg', origin: [0.5, 100 / 108], cup: { x: 0, y: -88 } },

    'enemy-cyber-orc':      { file: 'enemy-cyber-orc.svg', origin: [0.5, 1], eye: { x: 20, y: -63 }, top: -88 },

    'castle':               { file: 'castle.svg', origin: [0.5, 1], core: { x: 0, y: -178 }, pedestal: { x: 0, y: -122 } },
    'core-crystal':         { file: 'core-crystal.svg', origin: [0.5, 0.5] },

    'tree':                 { file: 'tree.svg', origin: [0.5, 1] },
    'rock':                 { file: 'rock.svg', origin: [0.5, 1] },
    'crystal-cluster':      { file: 'crystal-cluster.svg', origin: [0.5, 1], glow: { x: 2, y: -46 } },

    'projectile-bolt':      { file: 'projectile-bolt.svg', origin: [0.5, 0.5] },
    'projectile-plasma':    { file: 'projectile-plasma.svg', origin: [0.5, 0.5] },

    'icon-ether':           { file: 'icon-ether.svg', origin: [0.5, 0.5] },
    'icon-core':            { file: 'icon-core.svg', origin: [0.5, 0.5] },
    'icon-wave':            { file: 'icon-wave.svg', origin: [0.5, 0.5] }
};

// Tamanho das sombras elípticas no chão (largura, altura) por tipo de objeto.
export const SHADOWS = {
    'build-slot': [96, 34],
    'tower-crossbow': [84, 30],
    'tower-catapult': [124, 38],
    'enemy-cyber-orc': [64, 22],
    'castle': [270, 60],
    'tree': [80, 26],
    'rock': [66, 20],
    'crystal-cluster': [72, 22],
    'projectile-plasma': [34, 14],
    'projectile-bolt': [26, 9]
};
