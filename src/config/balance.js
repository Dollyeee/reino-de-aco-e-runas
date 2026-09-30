// ============================================================================
//  BALANCEAMENTO — Reino de Aço e Runas
//  Todos os números de gameplay moram aqui. Ajuste à vontade.
//  Unidades: distâncias em pixels do mundo (mapa = 1280×720), tempos em ms,
//  velocidades em pixels/segundo.
// ============================================================================

export const BALANCE = {

    // ---------------------------------------------------------------- economia
    economy: {
        startingEther: 150,          // éter no início da partida
        waveClearBonusBase: 25,      // bônus ao limpar uma onda...
        waveClearBonusPerWave: 10    // ...+ isto × número da onda
    },

    // ----------------------------------------------------------- núcleo arcano
    core: {
        maxHealth: 20                // vida do Núcleo Arcano
    },

    // ------------------------------------------------------------------ torres
    towers: {
        buildTime: 0.9,              // duração da materialização (s): a torre só atira depois disso
        laserCrossbow: {
            name: 'Besta Laser',
            description: 'Rápida e barata.\nDisparo laser em linha reta.',
            cost: 60,
            damage: 11,
            damageType: 'perfurante',
            canHit: ['terrestre'],   // camadas que consegue acertar (ver traitRules)
            range: 150,              // raio de alcance
            fireCooldown: 450,       // intervalo entre disparos
            projectileSpeed: 950,
            footprintRadius: 38      // raio ocupado no chão (posicionamento)
        },
        plasmaCatapult: {
            name: 'Catapulta de Plasma',
            description: 'Lenta e cara.\nDano em área, disparo em arco.',
            cost: 135,
            damage: 40,              // dano no centro da explosão
            damageType: 'explosivo',
            canHit: ['terrestre'],
            edgeDamageFactor: 0.5,   // fração do dano na borda da área
            splashRadius: 80,
            range: 215,
            minRange: 50,            // não atira em quem está colado nela
            fireCooldown: 2000,
            flightTime: 900,         // tempo de voo do projétil
            arcHeight: 170,          // altura máxima do arco
            footprintRadius: 46      // raio ocupado no chão (posicionamento)
        }
    },

    // ------------------------------------------------------------ posicionamento
    // Regras de área válida para construir torres em qualquer ponto do mapa.
    placement: {
        pathClearance: 4,            // folga além de (largura do caminho / 2 + raio da torre)
        worldMargin: 16,             // distância mínima das bordas do mundo
        uiPadding: 10,               // folga em volta do HUD e da barra de torres
        towerHeight: 95,             // altura aproximada da torre acima do centro (não pode invadir o HUD)
        decorationRadius: {          // raio de bloqueio por tipo de decoração (× escala da decoração)
            tree: 26,
            rock: 24,
            'crystal-cluster': 28
        },
        castle: { halfWidth: 140, above: 250, below: 26 }   // retângulo bloqueado em volta do castelo
    },

    // ---------------------------------------------------------------- inimigos
    enemies: {
        cyberOrc: {
            name: 'Orc Cibernético',
            health: 60,
            speed: 62,
            reward: 9,               // éter ganho ao derrotar
            coreDamage: 1,           // vida que tira do Núcleo ao chegar
            traits: ['terrestre'],   // características (ver traitRules)
            resist: {}               // multiplicador de dano por tipo (ausente = 1.0)
        }
    },

    // ------------------------------------------------------ tipos de dano e traits
    // Cada torre tem `damageType` e `canHit`; cada inimigo tem `traits` e `resist`.
    // Dano recebido = dano × resist do inimigo × resist das traits (ver src/combat/damage.js).
    // Upgrades futuros mudam capacidades da torre com modificadores (Tower.addCapabilityMod),
    // ex.: { damageType: 'explosivo' } ou { addCanHit: ['voador'] }.
    damageTypes: ['perfurante', 'explosivo'],

    // Efeito de cada trait. `layer` = camada em que o inimigo anda: a torre só o acerta se a camada
    // estiver no seu `canHit`. Definidas para a Fase 2; nenhum inimigo usa blindado/voador/escudo ainda.
    traitRules: {
        terrestre: { layer: 'terrestre' },
        voador: { layer: 'voador' },                     // só torres com 'voador' em canHit acertam
        blindado: { resist: { perfurante: 0.4 } },
        escudo: {
            shield: 40,                                  // dano absorvido antes da vida (placeholder)
            shieldRegen: 6,                              // escudo recuperado por segundo (placeholder)
            resistWhileShielded: { explosivo: 0.3 }      // só enquanto o escudo existir
        }
    },

    // ------------------------------------------------------------------- ondas
    // count: quantidade de inimigos | interval: ms entre spawns
    // healthMult / speedMult / rewardMult: multiplicadores sobre os valores base
    waves: [
        { enemy: 'cyberOrc', count: 8,  interval: 1150, healthMult: 1.0, speedMult: 1.00, rewardMult: 1.0 },
        { enemy: 'cyberOrc', count: 12, interval: 950,  healthMult: 1.4, speedMult: 1.05, rewardMult: 1.0 },
        { enemy: 'cyberOrc', count: 16, interval: 820,  healthMult: 1.9, speedMult: 1.10, rewardMult: 1.1 },
        { enemy: 'cyberOrc', count: 22, interval: 700,  healthMult: 2.5, speedMult: 1.15, rewardMult: 1.1 },
        { enemy: 'cyberOrc', count: 30, interval: 580,  healthMult: 3.5, speedMult: 1.22, rewardMult: 1.2 }
    ]
};
