import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, WORLD } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { makeArt, anchor, numberStyle, textStyle } from '../world/art.js';

const CARD_W = 156;
const CARD_H = 186;
const GAP = 14;
const PAD = 14;
const TOWER_ORDER = ['laserCrossbow', 'plasmaCatapult'];

// Painel flutuante que aparece sobre a plataforma escolhida, com uma carta por torre.
// Também mostra um painel de informações quando o jogador clica numa torre já construída.
export default class BuildMenu {
    constructor (scene) {
        this.scene = scene;
        this.root = null;
        this.cards = [];
        this.slotId = null;
    }

    get isOpen () { return !!this.root; }

    // ---------------------------------------------------------- construção

    open (slot, ether) {
        this.close(true);
        const scene = this.scene;
        this.slotId = slot.slotId;

        const w = CARD_W * 2 + GAP + PAD * 2;
        const h = CARD_H + PAD * 2 + 30;
        const { x, y, below } = this.placePanel(slot, w, h);

        this.root = scene.add.container(x, y).setDepth(10);
        this.root.add(this.panel(w, h, slot.x - x, below));
        this.root.add(this.blocker(w, h));

        const title = scene.add.text(0, -h / 2 + PAD + 8, 'Construir torre', textStyle(20, '#c8fdff')).setOrigin(0.5);
        this.root.add(title);

        this.cards = TOWER_ORDER.map((type, i) => {
            const cx = (i === 0 ? -1 : 1) * (CARD_W / 2 + GAP / 2);
            const card = this.card(type, cx, 15);
            this.root.add(card);
            card.setScale(0.4);
            scene.tweens.add({ targets: card, scale: 1, delay: 60 + i * 70, duration: 380, ease: 'Back.easeOut' });
            return card;
        });
        this.updateAffordability(ether);

        this.root.setScale(0.3, 0.2).setAlpha(0);
        scene.tweens.add({ targets: this.root, scaleX: 1, scaleY: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    }

    placePanel (slot, w, h) {
        let below = false;
        let y = slot.y - 58 - h / 2;
        if (y - h / 2 < 78) {
            y = slot.y + 44 + h / 2;
            below = true;
        }
        const x = Phaser.Math.Clamp(slot.x, w / 2 + 10, WORLD.width - w / 2 - 10);
        return { x, y, below };
    }

    // Painel com contorno grosso e "setinha" apontando para a plataforma.
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

    // Área invisível que "segura" cliques no fundo do painel (para não fechar o menu).
    blocker (w, h) {
        return this.scene.add.zone(0, 0, w, h + 10).setInteractive();
    }

    card (type, x, y) {
        const scene = this.scene;
        const stats = BALANCE.towers[type];
        const c = scene.add.container(x, y);
        c.type = type;
        c.homeX = x;

        const bg = scene.add.graphics();
        const drawBg = (hover) => {
            bg.clear();
            bg.fillStyle(COLORS.outline, 1);
            bg.fillRoundedRect(-CARD_W / 2 - 3, -CARD_H / 2 - 3, CARD_W + 6, CARD_H + 10, 18);
            bg.fillStyle(hover ? 0x2f9fbf : 0x2a1f3d, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H + 4, 16);
            bg.fillStyle(hover ? 0x5fe6ff : 0x584078, 1);
            bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H - 4, 16);
            bg.fillStyle(0xffffff, hover ? 0.35 : 0.12);
            bg.fillRoundedRect(-CARD_W / 2 + 10, -CARD_H / 2 + 6, CARD_W * 0.5, 5, 2.5);
            // "chão" da vitrine
            bg.fillStyle(COLORS.outline, 0.35);
            bg.fillEllipse(4, 18, 110, 26);
        };
        drawBg(false);
        c.add(bg);

        c.add(this.towerPreview(type, 0, 22));

        const name = scene.add.text(0, 38, stats.name, textStyle(19)).setOrigin(0.5);
        name.setScale(Math.min(1, (CARD_W - 16) / name.width)); // nomes longos cabem na carta
        const desc = scene.add.text(0, 62, stats.description.split('\n')[0], textStyle(12, '#d9d3e6', { strokeThickness: 3, shadow: undefined })).setOrigin(0.5);
        const icon = makeArt(scene, -22, 84, 'icon-ether', 0.5);
        const cost = scene.add.text(-8, 84, `${stats.cost}`, numberStyle(22, '#5ef0ff')).setOrigin(0, 0.5);
        c.add([name, desc, icon, cost]);
        c.costText = cost;

        c.setSize(CARD_W, CARD_H);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => {
            drawBg(true);
            scene.tweens.killTweensOf(c);
            scene.tweens.add({ targets: c, scale: 1.06, duration: 200, ease: 'Back.easeOut' });
            scene.game.events.emit(EVT.BUILD_PREVIEW, { slotId: this.slotId, type });
        });
        c.on('pointerout', () => {
            drawBg(false);
            scene.tweens.killTweensOf(c);
            scene.tweens.add({ targets: c, scale: 1, duration: 160 });
            scene.game.events.emit(EVT.BUILD_PREVIEW, { slotId: this.slotId, type: null });
        });
        c.on('pointerdown', () => {
            if (c.affordable) {
                scene.game.events.emit(EVT.BUILD_REQUEST, { slotId: this.slotId, type });
            } else {
                this.denied(c);
            }
        });
        return c;
    }

    // Miniatura da torre montada a partir dos mesmos SVGs do jogo.
    towerPreview (type, x, y) {
        const scene = this.scene;
        const k = type === 'laserCrossbow' ? 0.72 : 0.62;
        const box = scene.add.container(x, y);
        if (type === 'laserCrossbow') {
            const base = makeArt(scene, 0, 0, 'tower-crossbow-base', k);
            const m = anchor('tower-crossbow-base', 'headMount');
            const head = makeArt(scene, m.x * k, m.y * k, 'tower-crossbow-head', k).setRotation(-0.35);
            box.add([base, head]);
        } else {
            const base = makeArt(scene, 0, 0, 'tower-catapult-base', k);
            const p = anchor('tower-catapult-base', 'armPivot');
            const cup = anchor('tower-catapult-arm', 'cup');
            const arm = scene.add.container(p.x * k, p.y * k).setRotation(-0.35);
            arm.add([
                makeArt(scene, 0, 0, 'tower-catapult-arm', k),
                makeArt(scene, cup.x * k, (cup.y - 6) * k, 'projectile-plasma', k * 0.9)
            ]);
            box.add([base, arm]);
        }
        // respiração da miniatura
        scene.tweens.add({ targets: box, scaleY: 1.04, scaleX: 0.98, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return box;
    }

    updateAffordability (ether) {
        for (const c of this.cards) {
            const cost = BALANCE.towers[c.type].cost;
            c.affordable = ether >= cost;
            c.costText.setColor(c.affordable ? '#5ef0ff' : '#ff6b7a');
            c.setAlpha(c.affordable ? 1 : 0.72);
        }
    }

    denied (card) {
        const scene = this.scene;
        scene.tweens.killTweensOf(card);
        card.setScale(1);
        card.x = card.homeX;
        scene.tweens.add({
            targets: card,
            x: card.x + 8,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
        });
        scene.game.events.emit(EVT.NOT_ENOUGH_ETHER);
    }

    // --------------------------------------------------------- informações

    openInfo (slot) {
        this.close(true);
        const scene = this.scene;
        const s = BALANCE.towers[slot.type];
        const lines = [
            `Dano: ${s.damage}${s.splashRadius ? ' (em área)' : ''}`,
            `Alcance: ${s.range}`,
            `Disparo a cada ${(s.fireCooldown / 1000).toFixed(2)}s`
        ];
        const w = 250, h = 128;
        const { x, y, below } = this.placePanel({ x: slot.x, y: slot.y - 70 }, w, h);
        this.root = scene.add.container(x, y).setDepth(10);
        this.root.add(this.panel(w, h, slot.x - x, below));
        this.root.add(this.blocker(w, h));
        this.root.add(scene.add.text(0, -h / 2 + 24, s.name, textStyle(22, '#c8fdff')).setOrigin(0.5));
        lines.forEach((l, i) => {
            this.root.add(scene.add.text(0, -h / 2 + 56 + i * 22, l, textStyle(16, '#fff6e6', { strokeThickness: 4 })).setOrigin(0.5));
        });
        this.root.setScale(0.3, 0.2).setAlpha(0);
        scene.tweens.add({ targets: this.root, scaleX: 1, scaleY: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    }

    close (instant = false) {
        const root = this.root;
        if (!root) { return; }
        this.root = null;
        this.cards = [];
        this.slotId = null;
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
