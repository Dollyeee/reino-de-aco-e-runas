import Enemy from './Enemy.js';
import { BALANCE } from '../config/balance.js';

// Orc Cibernético: armadura metálica, olho robótico vermelho, clava de plasma.
export default class CyberOrc extends Enemy {
    constructor (scene, mods = {}) {
        const base = BALANCE.enemies.cyberOrc;
        const stats = {
            health: Math.round(base.health * (mods.healthMult || 1)),
            speed: base.speed * (mods.speedMult || 1),
            reward: Math.round(base.reward * (mods.rewardMult || 1)),
            coreDamage: base.coreDamage
        };
        super(scene, stats, 'enemy-cyber-orc');
    }
}
