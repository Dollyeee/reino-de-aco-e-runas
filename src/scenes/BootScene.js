import Phaser from 'phaser';
import { ART } from '../config/art.js';
import { RENDER_SCALE, WORLD } from '../config/visual.js';
import { createProceduralTextures } from '../effects/textures.js';
import { setupWorldCamera, textStyle } from '../world/art.js';

// Carrega os SVGs (rasterizados em RENDER_SCALE para ficarem nítidos) e cria texturas procedurais.
export default class BootScene extends Phaser.Scene {
    constructor () {
        super('BootScene');
    }

    preload () {
        setupWorldCamera(this.cameras.main);

        const cx = WORLD.width / 2, cy = WORLD.height / 2;
        this.add.text(cx, cy - 50, 'Reino de Aço e Runas', textStyle(48, '#3ff5ff')).setOrigin(0.5);
        const barBg = this.add.rectangle(cx, cy + 20, 420, 26, 0x2b1d33).setStrokeStyle(4, 0x44305a);
        const bar = this.add.rectangle(cx - 205, cy + 20, 0, 16, 0x3ff5ff).setOrigin(0, 0.5);
        this.load.on('progress', (p) => { bar.width = 410 * p; });
        barBg.setDepth(0);

        for (const [key, def] of Object.entries(ART)) {
            this.load.svg(key, `assets/${def.file}`, { scale: RENDER_SCALE });
        }
    }

    create () {
        createProceduralTextures(this);
        this.scene.start('GameScene');
    }
}
