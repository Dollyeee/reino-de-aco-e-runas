import Phaser from 'phaser';
import { ART, artFormat } from '../config/art.js';
import { RENDER_SCALE, WORLD } from '../config/visual.js';
import { createProceduralTextures } from '../effects/textures.js';
import { animKey, artPixelFactor, setupWorldCamera, textStyle } from '../world/art.js';

// Carrega a arte (SVG, PNG ou WebP, pela extensão no manifesto ART) e cria texturas procedurais.
// SVG é rasterizado já em size × RENDER_SCALE (nítido em qualquer tela); PNG/WebP entram no tamanho nativo.
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
            const url = `assets/${def.file}`;
            const format = artFormat(key);
            if (format === 'svg') {
                this.load.svg(key, url, { width: def.size[0] * RENDER_SCALE, height: def.size[1] * RENDER_SCALE });
            } else if ((format === 'png' || format === 'webp') && def.frame) {
                this.load.spritesheet(key, url, { frameWidth: def.frame[0], frameHeight: def.frame[1] });
            } else if (format === 'png' || format === 'webp') {
                this.load.image(key, url);
            } else {
                console.error(`[arte] formato não suportado em "${key}": ${def.file} (use .svg, .png ou .webp)`);
            }
        }
    }

    create () {
        this.checkArtSizes();
        createProceduralTextures(this);
        this.setupFilters();
        this.createAnims();
        this.scene.start('GameScene');
    }

    // O jogo roda em modo pixelArt (NEAREST). Texturas que NÃO são pixel art (SVGs, brilhos, sombras suaves)
    // voltam para LINEAR, para continuarem com a mesma aparência de antes.
    setupFilters () {
        const LINEAR = Phaser.Textures.FilterMode.LINEAR;
        for (const key of this.textures.getTextureKeys()) {
            if (ART[key] && ART[key].pixel) { continue; }
            if (key.startsWith('shadow-px')) { continue; }
            this.textures.get(key).setFilter(LINEAR);
        }
    }

    // Animações de sprite sheet declaradas no manifesto (ART[key].anims).
    createAnims () {
        for (const [key, def] of Object.entries(ART)) {
            if (!def.anims) { continue; }
            for (const [name, a] of Object.entries(def.anims)) {
                const k = animKey(key, name);
                if (this.anims.exists(k)) { continue; }
                this.anims.create({
                    key: k,
                    frames: this.anims.generateFrameNumbers(key, { start: a.start, end: a.end }),
                    frameRate: a.frameRate,
                    repeat: a.repeat ?? -1
                });
            }
        }
    }

    // Avisa quando um arquivo não corresponde ao tamanho lógico do manifesto (encaixes ficariam errados).
    checkArtSizes () {
        for (const [key, def] of Object.entries(ART)) {
            if (!this.textures.exists(key)) {
                console.error(`[arte] "${key}" não carregou: public/assets/${def.file}`);
                continue;
            }
            const src = this.textures.get(key).getSourceImage();
            const k = artPixelFactor(key);
            const fw = def.frame ? def.frame[0] : src.width, fh = def.frame ? def.frame[1] : src.height;
            const w = fw * k, h = fh * k;
            if (Math.abs(w - def.size[0]) > 1 || Math.abs(h - def.size[1]) > 1) {
                console.warn(`[arte] "${key}" (${def.file}) tem ${src.width}×${src.height} px → ${w.toFixed(1)}×${h.toFixed(1)} lógicos; ` +
                    `o manifesto espera ${def.size[0]}×${def.size[1]}. Confira o arquivo ou o campo "scale" em src/config/art.js.`);
            }
        }
    }
}
