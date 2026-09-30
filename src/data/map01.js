// Mapa 1 — "Vale das Runas"
// Coordenadas no mundo 1280×720. O caminho começa fora da tela à esquerda e termina no portão do castelo (subindo até a frente dele).

export const MAP01 = {
    name: 'Vale das Runas',

    // Pontos do caminho (os cantos são arredondados automaticamente)
    path: [
        { x: -80, y: 180 },
        { x: 300, y: 180 },
        { x: 300, y: 560 },
        { x: 620, y: 560 },
        { x: 620, y: 270 },
        { x: 900, y: 270 },
        { x: 900, y: 640 },
        { x: 1165, y: 640 },
        { x: 1165, y: 545 }
    ],
    pathWidth: 66,
    cornerRadius: 70,

    // Castelo e Núcleo Arcano (ponto de contato com o chão)
    castle: { x: 1165, y: 522 },

    // Plataformas rúnicas onde é possível construir
    buildSlots: [
        { id: 's1', x: 175, y: 285 },
        { id: 's2', x: 420, y: 175 },
        { id: 's3', x: 410, y: 360 },
        { id: 's4', x: 185, y: 470 },
        { id: 's5', x: 470, y: 470 },
        { id: 's6', x: 460, y: 655 },
        { id: 's7', x: 760, y: 170 },
        { id: 's8', x: 755, y: 385 },
        { id: 's9', x: 990, y: 430 },
        { id: 's10', x: 760, y: 580 },
        { id: 's11', x: 1035, y: 560 }
    ],

    // Decoração (tipo = nome do SVG em public/assets/)
    decorations: [
        { type: 'tree', x: 60, y: 110, scale: 1.0 },
        { type: 'tree', x: 120, y: 90, scale: 0.8 },
        { type: 'tree', x: 70, y: 380, scale: 1.1 },
        { type: 'tree', x: 90, y: 640, scale: 1.0 },
        { type: 'tree', x: 200, y: 690, scale: 0.85 },
        { type: 'tree', x: 540, y: 120, scale: 0.9 },
        { type: 'tree', x: 1060, y: 130, scale: 1.0 },
        { type: 'tree', x: 1140, y: 170, scale: 0.8 },
        { type: 'tree', x: 1230, y: 110, scale: 1.1 },
        { type: 'tree', x: 810, y: 695, scale: 0.9 },
        { type: 'tree', x: 640, y: 700, scale: 0.8 },
        { type: 'rock', x: 230, y: 360, scale: 0.9 },
        { type: 'rock', x: 520, y: 390, scale: 0.7 },
        { type: 'rock', x: 690, y: 450, scale: 0.8 },
        { type: 'rock', x: 980, y: 210, scale: 1.0 },
        { type: 'rock', x: 360, y: 700, scale: 0.8 },
        { type: 'rock', x: 1245, y: 665, scale: 0.8 },
        { type: 'crystal-cluster', x: 60, y: 520, scale: 0.9, light: true },
        { type: 'crystal-cluster', x: 830, y: 440, scale: 0.8, light: true },
        { type: 'crystal-cluster', x: 540, y: 265, scale: 0.75, light: true },
        { type: 'crystal-cluster', x: 1010, y: 712, scale: 0.8, light: true }
    ]
};
