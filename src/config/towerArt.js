// Torres em pixel art 1× (T19): 3 versões de cada torre para escolha. Sprites desenhados por `npm run pixel`
// (tools/pixel-art/sprites/torres/) → public/assets/torre-<torre>-<versão>-base.png e -cabeca.png / -braco.png.
//
// Fonte única dos encaixes (o gerador desenha nestes quadros e confere os pontos; o jogo usa os mesmos números):
//   base   { frame, pivot, frames?, fps? }  pivot = centro do chão da base (borda de baixo do quadro, ou acima dela
//                                  quando o sprite traz terra/capim em volta); frames > 1 = idle em loop (folha)
//   head   { frame, pivot, angles, phases? } (Besta) cabeça redesenhada em cada ângulo de mira (rad, 0 = direita,
//                                  + = para baixo); ângulos para a esquerda usam o quadro espelhado. pivot = eixo de giro
//                                  (centro do quadro). phases > 1 = idle da cabeça: quadro = fase × nº de ângulos + ângulo
//   arm    { frame, pivot, angles } (Catapulta) braço redesenhado em cada ângulo (0 = em pé; + = para a frente/direita);
//                                  pivot = eixo do braço (centro do quadro)
//   headMount / armPivot  {x, y}   eixo da peça de cima, em px a partir do pivot da base
//   muzzle / crystal      {x, y}   (Besta) na cabeça apontando para a direita, a partir do eixo de giro
//   cup / orb             {x, y}   (Catapulta) no braço em pé, a partir do eixo do braço
//   shadow [w, h]                 elipse de pixels no chão
//   float                         (opcional) px que a cabeça sobe/desce (pedestal flutuante)
//   head.foreshorten              (opcional, T26) escorço 3/4 da cabeça: ver groundAngle/headPoint
//   footprintRadius               (opcional, T26) raio ocupado no chão por esta arte (troca o de BALANCE quando ativa)
//   upgrades                      onde entram as peças dos níveis 3 e 4 (caminhos do DESIGN.md) — ainda não desenhadas
//
// Versão usada no jogo: TOWER_VARIANT em src/config/art.js ('atual' = SVGs | 'a' | 'b' | 'c') ou ?besta=a&catapulta=b.

const deg = (d) => (d * Math.PI) / 180;
const range = (a, b, step) => { const out = []; for (let v = a; v <= b + 1e-9; v += step) { out.push(deg(v)); } return out; };

// mira da besta: -90° (para cima) a +90° (para baixo), de 15 em 15°; o lado esquerdo é o espelho
export const HEAD_ANGLES = range(-90, 90, 15);
// braço da catapulta: -50° (puxado para trás) a +60° (arremesso), de 10 em 10°
export const ARM_ANGLES = range(-50, 60, 10);

export const TOWER_ART = {
    laserCrossbow: {
        a: {
            name: 'Torre de vigia',
            note: 'Madeira e pedra, besta mecânica no topo, arco com cordas de energia ciano. (T20: passada de acabamento — 3/4, texturas, idle.)',
            base: { frame: [100, 98], pivot: [50, 92], frames: 4, fps: 6 },
            head: { frame: [84, 84], pivot: [42, 42], angles: HEAD_ANGLES, phases: 3 },
            headMount: { x: 0, y: -64 }, muzzle: { x: 36, y: 0 }, crystal: { x: -10, y: 0 },
            shadow: [60, 16],
            upgrades: {
                3: 'Rajada: segundo arco sobreposto; Perfurante: ponta de arpão de aço no trilho; Sentinela: luneta sobre a coronha',
                4: 'telhado de tábuas vira ninho coberto com bandeira; arco duplo (Rajada) / balestra pesada (Perfurante) / farol ciano no mastro (Sentinela)'
            }
        },
        b: {
            name: 'Pedestal rúnico',
            note: 'Pedestal de pedra flutuando sobre runas, besta de metal escuro com cristal-mira ciano.',
            base: { frame: [76, 70], pivot: [38, 70] },
            head: { frame: [66, 66], pivot: [33, 33], angles: HEAD_ANGLES },
            headMount: { x: 0, y: -60 }, muzzle: { x: 27, y: 0 }, crystal: { x: -2, y: -8 },
            shadow: [64, 20], float: 1,
            upgrades: {
                3: 'cristal-mira maior (Perfurante) / três cristais em leque (Rajada) / anel rúnico em volta do pedestal (Sentinela)',
                4: 'segundo bloco flutuante com runas acesas; besta ganha asas de metal e o cristal vira um prisma grande'
            }
        },
        c: {
            name: 'Sentinela de aço',
            note: 'Bunker compacto de aço rebitado, trilho de disparo de plasma e visor ciano.',
            base: { frame: [78, 58], pivot: [39, 58] },
            head: { frame: [66, 66], pivot: [33, 33], angles: HEAD_ANGLES },
            headMount: { x: 0, y: -48 }, muzzle: { x: 29, y: 0 }, crystal: { x: -9, y: -4 },
            shadow: [74, 22],
            upgrades: {
                3: 'cano duplo (Rajada) / trilho alongado com bobinas (Perfurante) / antena e luneta sobre o visor (Sentinela)',
                4: 'placas extras na base e escudo frontal; torre dupla com dois trilhos (Rajada) ou radar giratório (Sentinela)'
            }
        },
        n: {
            name: 'Torre de vigia — nova técnica',
            note: 'T22: composta com peças desenhadas à mão (lib/materiais) em 4 etapas; pedra com rejunte, musgo e runas, corpo de tábuas com postes e cintas, piso com ameias, estandarte azul, janela ciano, suporte com anel rúnico.',
            base: { frame: [112, 104], pivot: [56, 96], frames: 4, fps: 5 },
            head: { frame: [72, 72], pivot: [36, 36], angles: HEAD_ANGLES, phases: 3 },
            headMount: { x: 0, y: -86 }, muzzle: { x: 31, y: 0 }, crystal: { x: -9, y: 0 },
            shadow: [60, 16],
            upgrades: {
                3: 'Rajada: segundo arco sobre o suporte; Perfurante: ponta de arpão e cinta dupla na coronha; Sentinela: luneta e bandeirola no suporte',
                4: 'telhado de ardósia sobre as ameias; besta dupla (Rajada) / balestra de ferro (Perfurante) / farol rúnico na ameia de trás (Sentinela)'
            }
        },
        n1: {
            name: 'Torreão redondo de pedra',
            note: 'T24: cilindro de pedra com ameias em volta, porta de madeira, seteiras ciano e estandarte azul; a arma fica num pedestal acima das ameias.',
            base: { frame: [112, 104], pivot: [56, 96], frames: 4, fps: 5 },
            head: { frame: [72, 72], pivot: [36, 36], angles: HEAD_ANGLES, phases: 3 },
            headMount: { x: 0, y: -75 }, muzzle: { x: 31, y: 0 }, crystal: { x: -9, y: 0 },
            shadow: [60, 16],
            upgrades: { 3: 'cobertura de ardósia nas ameias (Sentinela) / segunda seteira acesa (Rajada) / cinta de ferro no cilindro (Perfurante)', 4: 'torreão mais alto com um segundo andar e bandeiras' }        },
        n2: {
            name: 'Paliçada de troncos',
            note: 'T24: muralha de troncos pontudos com cintas de ferro, plataforma atrás com parapeito e tocha acesa.',
            base: { frame: [112, 104], pivot: [56, 96], frames: 4, fps: 5 },
            head: { frame: [72, 72], pivot: [36, 36], angles: HEAD_ANGLES, phases: 3 },
            headMount: { x: 0, y: -66 }, muzzle: { x: 31, y: 0 }, crystal: { x: -9, y: 0 },
            shadow: [60, 16],
            upgrades: { 3: 'estacas de ferro nas pontas (Perfurante) / plataforma dupla (Rajada) / torre de vigia com bandeira (Sentinela)', 4: 'paliçada dupla com portão e duas tochas' }        },
        n3: {
            name: 'Altar rúnico em degraus',
            note: 'T24: três degraus de pedra baixos e largos com runas ciano e cristais nos cantos; pedestal alto no topo.',
            base: { frame: [112, 104], pivot: [56, 96], frames: 4, fps: 5 },
            head: { frame: [72, 72], pivot: [36, 36], angles: HEAD_ANGLES, phases: 3 },
            headMount: { x: 0, y: -57 }, muzzle: { x: 31, y: 0 }, crystal: { x: -9, y: 0 },
            shadow: [60, 16],
            upgrades: { 3: 'cristais maiores nos cantos (Sentinela) / quarto degrau (Perfurante) / anel rúnico flutuando sobre o altar (Rajada)', 4: 'obelisco rúnico no lugar do pedestal, cristais em volta' }
        },
        s: {
            name: 'Besta solo',
            note: 'T26: sem corpo de torre — a besta mecânica grande sobre um apoio baixo (pedestal de pedra com runa); não esconde os orcs atrás.',
            base: { frame: [84, 52], pivot: [42, 46], frames: 2, fps: 3 },
            // foreshorten: escorço 3/4 — a besta deitada no plano do chão encurta quando mira para cima/baixo
            head: { frame: [84, 84], pivot: [42, 42], angles: HEAD_ANGLES, phases: 3, foreshorten: 0.7 },
            headMount: { x: 0, y: -29 }, muzzle: { x: 35, y: 0 }, crystal: { x: -10, y: 0 },
            shadow: [52, 14],
            // raio ocupado no chão por ESTA arte (menor que o da torre: substitui BALANCE…footprintRadius quando ativa)
            footprintRadius: 30,
            upgrades: {
                3: 'a arma ganha peças: arco duplo (Rajada), trilho de plasma sob o virote (Perfurante) ou luneta sobre o tampo (Sentinela); o apoio ganha placas de aço rebitadas',
                4: 'besta pesada com dois arcos e carregador (Rajada) / canhão de trilho com bobinas (Perfurante) / luneta rúnica com antena (Sentinela); o apoio se tecnifica: pistões hidráulicos e um anel rúnico girando em volta'
            }
        }
    },
    plasmaCatapult: {
        a: {
            name: 'Catapulta de rodas',
            note: 'Catapulta clássica de madeira sobre rodas reforçadas com ferro; concha com orbe de plasma.',
            base: { frame: [96, 58], pivot: [48, 58] },
            arm: { frame: [140, 140], pivot: [70, 70], angles: ARM_ANGLES },
            armPivot: { x: 2, y: -40 }, cup: { x: 0, y: -56 }, orb: { x: 0, y: -61 },
            shadow: [92, 26],
            upgrades: {
                3: 'concha dupla (Fragmentação) / braço reforçado com cintas de ferro (Devastação) / tanque de ácido verde na traseira (Corrosão)',
                4: 'rodas trocadas por esteira de ferro; concha vira cesto de sub-bombas ou caldeirão corrosivo'
            }
        },
        b: {
            name: 'Trabuco rúnico',
            note: 'Trabuco alto, braço longo e contrapeso de pedra rúnica brilhando.',
            base: { frame: [90, 82], pivot: [45, 82] },
            arm: { frame: [150, 150], pivot: [75, 75], angles: ARM_ANGLES },
            armPivot: { x: 0, y: -66 }, cup: { x: 0, y: -64 }, orb: { x: 0, y: -69 },
            shadow: [84, 24],
            upgrades: {
                3: 'contrapeso maior com mais runas (Devastação) / funda dupla (Fragmentação) / contrapeso rachado vazando energia (Corrosão)',
                4: 'estrutura dobrada com dois braços, ou contrapeso vira um cristal rúnico flutuante'
            }
        },
        c: {
            name: 'Morteiro-forja',
            note: 'Base de pedra e ferro com braço hidráulico e reator de plasma visível.',
            base: { frame: [94, 60], pivot: [47, 60] },
            arm: { frame: [124, 124], pivot: [62, 62], angles: ARM_ANGLES },
            armPivot: { x: -6, y: -40 }, cup: { x: 0, y: -48 }, orb: { x: 0, y: -53 },
            shadow: [90, 26],
            upgrades: {
                3: 'segundo pistão e reator maior (Devastação) / tambor de sub-bombas ao lado (Fragmentação) / tubos de ácido no braço (Corrosão)',
                4: 'chaminé de forja com fumaça ciano; braço duplo ou reator exposto em anel'
            }
        }
    }
};

// Quadro da peça que gira para um ângulo: índice do ângulo mais próximo (e se usa o espelho).
// Escorço 3/4 da cabeça (head.foreshorten = sy, T26): o quadro de ângulo `a` (direção na tela) é a besta girada no
// plano do chão pelo ângulo φ = groundAngle(a, sy) e achatada em y por sy. headPoint dá onde um ponto da cabeça
// (muzzle, crystal: medidos com a besta apontando para a direita) cai na tela nesse quadro. Sem escorço = rotação simples.
export function groundAngle (a, sy = 1) {
    return sy === 1 ? a : Math.atan2(Math.sin(a) / sy, Math.cos(a));
}
export function headPoint (p, a, sy = 1) {
    const f = groundAngle(a, sy), c = Math.cos(f), s = Math.sin(f);
    return { x: p.x * c - p.y * s, y: (p.x * s + p.y * c) * sy };
}

export function headFrameFor (aim) {
    let a = Math.atan2(Math.sin(aim), Math.cos(aim));
    let flip = false;
    if (Math.cos(a) < 0) { a = Math.PI - a; flip = true; }         // lado esquerdo = espelho do direito
    a = Math.atan2(Math.sin(a), Math.cos(a));
    let best = 0;
    HEAD_ANGLES.forEach((v, i) => { if (Math.abs(v - a) < Math.abs(HEAD_ANGLES[best] - a)) { best = i; } });
    return { frame: best, flip, angle: flip ? Math.PI - HEAD_ANGLES[best] : HEAD_ANGLES[best] };
}

export function armFrameFor (rotation) {
    let best = 0;
    ARM_ANGLES.forEach((v, i) => { if (Math.abs(v - rotation) < Math.abs(ARM_ANGLES[best] - rotation)) { best = i; } });
    return best;
}
