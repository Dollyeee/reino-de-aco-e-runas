// Kits de decoração em pixel art 1× (T15). Os sprites são desenhados por `npm run pixel`
// (tools/pixel-art/sprites/decoracao/) e exportados como public/assets/decor-<kit>-<item>.png.
//
// Este arquivo é a fonte única dos encaixes de cada item — o gerador desenha no quadro daqui e confere os pontos:
//   frame  [w, h]  tamanho do quadro (= tamanho no mundo, pixel art 1×)
//   pivot  [x, y]  ponto de contato com o chão (borda de baixo do quadro, como os pés do orc)
//   shadow [w, h]  elipse de pixels no chão (regras do ART_SPEC: ≈ 70–90% da largura da base, altura ≈ 1/3)
//   block          raio ocupado no chão pela arte (bloqueia construção de torres; PlacementRules)
//   glow   {x, y}  (cristais) centro do brilho, em px a partir do pivot
//
// Kit de cada mapa: `decorKit` em src/data/mapXX.js (padrão DECOR_KIT em src/config/art.js) e, por item, `kit`
// (ex.: { type: 'arvore2', kit: 'c' }) para transições. ?decor=b na URL força um kit no mapa inteiro (teste).
// Cada kit = bioma de um mapa (DESIGN.md): A Bosque antigo (mapa 1), B Fronteira de pinheiros (mapa futuro de
// montanha/fronteira), C Floresta rúnica (contaminação perto do Núcleo Arcano).

export const DECOR_ITEMS = ['arvore1', 'arvore2', 'arvore3', 'arbusto1', 'arbusto2', 'pedraP', 'pedraM', 'pedraG', 'cristal', 'tema'];

export const DECOR_KITS = {
    a: {
        name: 'Bosque antigo',
        note: 'Carvalhos largos e retorcidos, copas densas verde-musgo, pedras com musgo; toco de árvore cortado.',
        items: {
            arvore1: { label: 'carvalho grande', frame: [132, 124], pivot: [66, 124], shadow: [86, 26], block: 30 },
            arvore2: { label: 'carvalho torto', frame: [108, 112], pivot: [48, 112], shadow: [66, 22], block: 25 },
            arvore3: { label: 'carvalho jovem', frame: [80, 92], pivot: [40, 92], shadow: [48, 16], block: 19 },
            arbusto1: { label: 'moita redonda', frame: [48, 34], pivot: [24, 34], shadow: [36, 12], block: 17 },
            arbusto2: { label: 'moita baixa', frame: [64, 34], pivot: [32, 34], shadow: [50, 14], block: 22 },
            pedraP: { label: 'pedra pequena', frame: [26, 18], pivot: [13, 18], shadow: [22, 7], block: 11 },
            pedraM: { label: 'pedra média', frame: [42, 30], pivot: [21, 30], shadow: [36, 12], block: 17 },
            pedraG: { label: 'pedra grande', frame: [66, 46], pivot: [33, 46], shadow: [58, 18], block: 26 },
            cristal: { label: 'cristais', frame: [48, 56], pivot: [24, 56], shadow: [38, 12], block: 17, glow: { x: 0, y: -26 } },
            tema: { label: 'toco cortado', frame: [48, 36], pivot: [24, 36], shadow: [42, 13], block: 20 }
        }
    },
    b: {
        name: 'Fronteira de pinheiros',
        note: 'Pinheiros e abetos altos e escuros, arbustos espinhosos, pedras angulosas cinza-frias; marco de pedra com runa.',
        items: {
            arvore1: { label: 'pinheiro alto', frame: [70, 138], pivot: [35, 138], shadow: [48, 16], block: 22 },
            arvore2: { label: 'abeto largo', frame: [96, 120], pivot: [48, 120], shadow: [66, 20], block: 28 },
            arvore3: { label: 'pinheiro jovem', frame: [52, 86], pivot: [26, 86], shadow: [34, 11], block: 16 },
            arbusto1: { label: 'espinheiro', frame: [50, 31], pivot: [25, 31], shadow: [40, 12], block: 19 },
            arbusto2: { label: 'espinheiro baixo', frame: [42, 25], pivot: [21, 25], shadow: [32, 10], block: 15 },
            pedraP: { label: 'pedra pequena', frame: [26, 19], pivot: [13, 19], shadow: [22, 7], block: 11 },
            pedraM: { label: 'pedra média', frame: [42, 33], pivot: [21, 33], shadow: [36, 12], block: 17 },
            pedraG: { label: 'pedra grande', frame: [66, 53], pivot: [33, 53], shadow: [58, 18], block: 26 },
            cristal: { label: 'cristais', frame: [46, 57], pivot: [23, 57], shadow: [36, 12], block: 16, glow: { x: 0, y: -28 } },
            tema: { label: 'marco rúnico', frame: [34, 62], pivot: [17, 62], shadow: [28, 9], block: 14 }
        }
    },
    c: {
        name: 'Floresta rúnica',
        note: 'Árvores de casca escura com veias de ciano, cristais maiores brotando do chão, pedras com fissuras rúnicas; ruína de pilar com circuito exposto.',
        items: {
            arvore1: { label: 'árvore rúnica grande', frame: [118, 128], pivot: [59, 128], shadow: [74, 22], block: 28 },
            arvore2: { label: 'árvore rúnica alta', frame: [94, 120], pivot: [47, 120], shadow: [58, 18], block: 23 },
            arvore3: { label: 'árvore rúnica jovem', frame: [74, 96], pivot: [37, 96], shadow: [44, 14], block: 18 },
            arbusto1: { label: 'moita escura', frame: [48, 34], pivot: [24, 34], shadow: [36, 12], block: 17 },
            arbusto2: { label: 'moita baixa escura', frame: [64, 34], pivot: [32, 34], shadow: [50, 14], block: 22 },
            pedraP: { label: 'pedra pequena', frame: [26, 18], pivot: [13, 18], shadow: [22, 7], block: 11 },
            pedraM: { label: 'pedra média', frame: [42, 30], pivot: [21, 30], shadow: [36, 12], block: 17 },
            pedraG: { label: 'pedra grande', frame: [66, 46], pivot: [33, 46], shadow: [58, 18], block: 26 },
            cristal: { label: 'cristais grandes', frame: [68, 85], pivot: [34, 85], shadow: [56, 16], block: 25, glow: { x: 0, y: -40 } },
            tema: { label: 'ruína de pilar', frame: [56, 94], pivot: [28, 94], shadow: [48, 14], block: 22 }
        }
    }
};

// Resolve uma decoração do mapa: item = `type`; kit = `force` (teste com ?decor=) || `d.kit` (peça de outro kit,
// ex.: transição) || kit base do mapa. Devolve { kit, item, def, key } ou null se o item não existir.
export function decorFor (d, baseKit, force = null) {
    const kit = force || d.kit || baseKit;
    const def = DECOR_KITS[kit] && DECOR_KITS[kit].items[d.type];
    return def ? { kit, item: d.type, def, key: `decor-${kit}-${d.type}` } : null;
}
