import { ENEMY_TYPES } from '../enemies/index.js';

// Controla as ondas: fila de spawns, intervalo entre inimigos e detecção de fim de onda.
export default class WaveManager {
    constructor (scene, waves) {
        this.scene = scene;
        this.waves = waves;
        this.index = -1;          // onda atual (0-based); -1 = nenhuma começou
        this.toSpawn = 0;
        this.timer = 0;
        this.active = false;
    }

    get total () { return this.waves.length; }
    get number () { return this.index + 1; }
    get hasNext () { return this.index + 1 < this.waves.length; }
    get isLast () { return this.index === this.waves.length - 1; }

    start () {
        if (this.active || !this.hasNext) { return false; }
        this.index++;
        const w = this.waves[this.index];
        this.toSpawn = w.count;
        this.timer = 0;
        this.active = true;
        return true;
    }

    update (dt) {
        if (!this.active) { return; }
        const w = this.waves[this.index];

        if (this.toSpawn > 0) {
            this.timer -= dt * 1000;
            if (this.timer <= 0) {
                this.spawn(w);
                this.toSpawn--;
                this.timer = w.interval;
            }
            return;
        }

        // todos já nasceram: a onda termina quando não sobrar ninguém vivo
        if (!this.scene.enemies.some((e) => e.alive)) {
            this.active = false;
            this.scene.onWaveCleared(this.number);
        }
    }

    spawn (w) {
        const Type = ENEMY_TYPES[w.enemy];
        const enemy = new Type(this.scene, w);
        this.scene.enemies.push(enemy);
    }
}
