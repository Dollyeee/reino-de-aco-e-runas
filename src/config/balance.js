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
        laserCrossbow: {
            name: 'Besta Laser',
            description: 'Rápida e barata.\nDisparo laser em linha reta.',
            cost: 60,
            damage: 11,
            range: 150,              // raio de alcance
            fireCooldown: 450,       // intervalo entre disparos
            projectileSpeed: 950
        },
        plasmaCatapult: {
            name: 'Catapulta de Plasma',
            description: 'Lenta e cara.\nDano em área, disparo em arco.',
            cost: 120,
            damage: 40,              // dano no centro da explosão
            edgeDamageFactor: 0.5,   // fração do dano na borda da área
            splashRadius: 80,
            range: 215,
            minRange: 50,            // não atira em quem está colado nela
            fireCooldown: 2000,
            flightTime: 900,         // tempo de voo do projétil
            arcHeight: 170           // altura máxima do arco
        }
    },

    // ---------------------------------------------------------------- inimigos
    enemies: {
        cyberOrc: {
            name: 'Orc Cibernético',
            health: 60,
            speed: 62,
            reward: 9,               // éter ganho ao derrotar
            coreDamage: 1            // vida que tira do Núcleo ao chegar
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
        { enemy: 'cyberOrc', count: 30, interval: 580,  healthMult: 3.1, speedMult: 1.22, rewardMult: 1.2 }
    ]
};
