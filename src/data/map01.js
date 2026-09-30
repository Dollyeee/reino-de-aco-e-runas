// Mapa 1 — "Vale das Runas"
// Coordenadas no mundo 1280×720. O caminho começa fora da tela à esquerda e termina no portão do castelo (subindo até a frente dele).

export const MAP01 = {
    name: 'Vale das Runas',

    // Chão em pixel art gerado por `npm run pixel` a partir deste arquivo (tools/pixel-art/cenario/chao.js).
    // Mudou o caminho? Rode `npm run pixel` de novo (o jogo avisa no console se o chão estiver desatualizado).
    ground: 'ground-map01',

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

    // Decoração em pixel art (kits em src/config/decor.js; T15/T18). Também bloqueia a construção de torres
    // (raio `block` de cada item). `type` = item do kit (arvore1-3, arbusto1-2, pedraP/M/G, cristal, tema);
    // `kit` troca o kit só daquele item (sem `kit` = decorKit do mapa).
    // Vale das Runas: Bosque antigo (A) na entrada; perto do castelo a floresta fica "contaminada" pela energia do
    // Núcleo Arcano e peças da Floresta rúnica (C) aparecem — cristais grandes, árvores com veias ciano, pedras com
    // fissuras e o pilar em ruína. Na entrada, o único ciano são os cristais pequenos do kit A.
    decorKit: 'a',
    decorations: [
        // entrada e meio do mapa: Bosque antigo
        { type: 'arvore1', x: 60, y: 110 },
        { type: 'arvore3', x: 120, y: 90 },
        { type: 'arvore1', x: 70, y: 380 },
        { type: 'arvore1', x: 90, y: 640 },
        { type: 'arvore3', x: 200, y: 690 },
        { type: 'arvore2', x: 540, y: 120 },
        { type: 'arvore3', x: 640, y: 700 },
        { type: 'arvore2', x: 810, y: 695 },
        { type: 'pedraG', x: 230, y: 360 },
        { type: 'pedraP', x: 520, y: 390 },
        { type: 'pedraM', x: 690, y: 450 },
        { type: 'pedraM', x: 360, y: 700 },
        { type: 'cristal', x: 60, y: 520 },
        { type: 'cristal', x: 540, y: 265 },
        { type: 'cristal', x: 830, y: 440 },
        { type: 'arbusto1', x: 250, y: 112 },
        { type: 'arbusto2', x: 720, y: 145 },
        { type: 'arbusto2', x: 470, y: 655 },
        { type: 'arbusto1', x: 150, y: 455 },
        { type: 'tema', x: 200, y: 578 },                  // toco cortado
        // terço final (perto do castelo): transição para a Floresta rúnica
        { type: 'arvore3', x: 1140, y: 170 },
        { type: 'arvore1', x: 1060, y: 130, kit: 'c' },
        { type: 'arvore2', x: 1230, y: 110, kit: 'c' },
        { type: 'pedraG', x: 980, y: 210, kit: 'c' },
        { type: 'pedraM', x: 1245, y: 665, kit: 'c' },
        { type: 'cristal', x: 930, y: 130, kit: 'c' },
        { type: 'cristal', x: 1010, y: 712, kit: 'c' },
        { type: 'tema', x: 975, y: 320, kit: 'c' }         // ruína de pilar com circuito exposto
    ]
};
