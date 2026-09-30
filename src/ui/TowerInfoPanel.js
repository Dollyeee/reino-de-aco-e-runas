import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, WORLD } from '../config/visual.js';
import { textStyle } from '../world/art.js';

// Painel flutuante com as informações de uma torre já construída (abre ao clicar nela).
export default class TowerInfoPanel {
    constructor (scene) {
        this.scene = scene;
        this.root = null;
    }

    get isOpen () { return !!this.root; }

    // info = { x, y, type } — (x, y) é o centro da plataforma da torre.
    open (info) {
        this.close(true);
        const scene = this.scene;
        const s = BALANCE.towers[info.type];
        const lines = [
            `Dano: ${s.damage}${s.splashRadius ? ' (em área)' : ''}`,
            `Alcance: ${s.range}`,
            `Disparo a cada ${(s.fireCooldown / 1000).toFixed(2)}s`
        ];
        const w = 250, h = 128;
        const { x, y, below } = this.placePanel({ x: info.x, y: info.y - 70 }, w, h);
        this.root = scene.add.container(x, y).setDepth(10);
        this.root.add(this.panel(w, h, info.x - x, below));
        this.root.add(scene.add.zone(0, 0, w, h + 10).setInteractive()); // segura cliques no fundo do painel
        this.root.add(scene.add.text(0, -h / 2 + 24, s.name, textStyle(22, '#c8fdff')).setOrigin(0.5));
        lines.forEach((l, i) => {
            this.root.add(scene.add.text(0, -h / 2 + 56 + i * 22, l, textStyle(16, '#fff6e6', { strokeThickness: 4 })).setOrigin(0.5));
        });
        this.root.setScale(0.3, 0.2).setAlpha(0);
        scene.tweens.add({ targets: this.root, scaleX: 1, scaleY: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    }

    placePanel (anchorPt, w, h) {
        let below = false;
        let y = anchorPt.y - 58 - h / 2;
        if (y - h / 2 < 78) {
            y = anchorPt.y + 44 + h / 2;
            below = true;
        }
        const x = Phaser.Math.Clamp(anchorPt.x, w / 2 + 10, WORLD.width - w / 2 - 10);
        return { x, y, below };
    }

    // Painel com contorno grosso e "setinha" apontando para a torre.
    panel (w, h, arrowX, below) {
        const g = this.scene.add.graphics();
        const ax = Phaser.Math.Clamp(arrowX, -w / 2 + 30, w / 2 - 30);
        const tipY = below ? -h / 2 - 22 : h / 2 + 22;
        const baseY = below ? -h / 2 + 2 : h / 2 - 2;
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 14, 24);
        g.fillTriangle(ax - 20, baseY, ax + 20, baseY, ax, tipY + (below ? -6 : 6));
        g.fillStyle(0x3a2850, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h + 4, 20);
        g.fillStyle(COLORS.uiPanelLight, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h - 4, 20);
        g.fillTriangle(ax - 13, baseY, ax + 13, baseY, ax, tipY);
        g.fillStyle(0x6a4f8a, 0.9);
        g.fillRoundedRect(-w / 2 + 14, -h / 2 + 6, w * 0.4, 5, 2.5);
        g.lineStyle(2, COLORS.cyan, 0.5);
        g.strokeRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 16, 16);
        return g;
    }

    close (instant = false) {
        const root = this.root;
        if (!root) { return; }
        this.root = null;
        if (instant) {
            root.destroy();
            return;
        }
        this.scene.tweens.add({
            targets: root,
            scaleX: 0.4,
            scaleY: 0.2,
            alpha: 0,
            duration: 140,
            ease: 'Back.easeIn',
            onComplete: () => root.destroy()
        });
    }
}
