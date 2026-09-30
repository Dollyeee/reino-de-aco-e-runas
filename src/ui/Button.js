import Phaser from 'phaser';
import { COLORS } from '../config/visual.js';
import { textStyle } from '../world/art.js';

const PALETTES = {
    cyan: { base: 0x35d8f0, dark: 0x1690b8, light: 0xc8fdff, text: '#fff6e6' },
    gold: { base: 0xffc23d, dark: 0xd98a1c, light: 0xfff0b0, text: '#fff6e6' },
    grey: { base: 0x8a829e, dark: 0x5f5873, light: 0xc9c2dc, text: '#d9d3e6' }
};

// Botão cartoon com cel shading (face clara, borda inferior escura, brilho no topo)
// e animações de squash ao passar o mouse e ao clicar.
export default class Button extends Phaser.GameObjects.Container {
    constructor (scene, x, y, w, h, label, onClick, opts = {}) {
        super(scene, x, y);
        scene.add.existing(this);
        this.w = w;
        this.h = h;
        this.onClick = onClick;
        this.palette = opts.palette || 'cyan';
        this.enabled = true;

        this.bg = scene.add.graphics();
        this.label = scene.add.text(0, -3, label, textStyle(opts.fontSize || 26)).setOrigin(0.5);
        this.add([this.bg, this.label]);
        this.draw();

        this.setSize(w, h + 6);
        this.setInteractive({ useHandCursor: true });
        this.on('pointerover', () => this.enabled && this.tweenScale(1.07, 1.07, 220, 'Back.easeOut'));
        this.on('pointerout', () => this.tweenScale(1, 1, 180, 'Quad.easeOut'));
        this.on('pointerdown', () => {
            if (!this.enabled) { return; }
            this.tweenScale(1.12, 0.86, 70, 'Quad.easeOut');
        });
        this.on('pointerup', () => {
            if (!this.enabled) { return; }
            this.scene.tweens.killTweensOf(this);
            this.scene.tweens.add({ targets: this, scaleX: 1.05, scaleY: 1.05, duration: 500, ease: 'Elastic.easeOut' });
            if (this.onClick) { this.onClick(); }
        });
    }

    tweenScale (sx, sy, duration, ease) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({ targets: this, scaleX: sx, scaleY: sy, duration, ease });
    }

    draw () {
        const p = PALETTES[this.enabled ? this.palette : 'grey'];
        const g = this.bg;
        const w = this.w, h = this.h, r = Math.min(18, h / 2.4);
        g.clear();
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 14, r + 3);
        g.fillStyle(p.dark, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h + 6, r);
        g.fillStyle(p.base, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h - 2, r);
        g.fillStyle(p.light, 0.85);
        g.fillRoundedRect(-w / 2 + 10, -h / 2 + 6, w * 0.45, 6, 3);
        g.fillCircle(w / 2 - 16, -h / 2 + 9, 3);
        this.label.setColor(p.text);
    }

    setLabel (text) {
        this.label.setText(text);
        return this;
    }

    setEnabled (enabled) {
        if (this.enabled === enabled) { return this; }
        this.enabled = enabled;
        this.draw();
        if (this.input) { this.input.cursor = enabled ? 'pointer' : 'default'; }
        if (enabled) {
            // "acorda" com um pulinho
            this.setScale(0.85, 1.15);
            this.tweenScale(1, 1, 600, 'Elastic.easeOut');
        }
        return this;
    }
}
