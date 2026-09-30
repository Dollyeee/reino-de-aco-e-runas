import { BALANCE } from '../config/balance.js';
import { COLORS, TOWER_BAR } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { makeArt, numberStyle, textStyle } from '../world/art.js';
import { towerBarRect } from '../world/PlacementRules.js';
import { towerPreview, tintPreview } from './towerPreview.js';

export const TOWER_ORDER = ['laserCrossbow', 'plasmaCatapult'];
const DRAG_THRESHOLD = 16;

// Barra fixa na parte de baixo da tela, com uma carta por torre (ícone, nome, custo, atalho 1/2).
// Clique na carta (ou tecla) → modo posicionamento. No toque: arraste a carta até o mapa e solte.
export default class TowerBar {
    constructor (scene) {
        this.scene = scene;
        this.ether = 0;
        this.activeType = null;
        this.enabled = true;

        const r = towerBarRect();
        const g = scene.add.graphics();
        g.fillStyle(COLORS.outline, 1);
        g.fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 12, 20);
        g.fillStyle(0x3a2850, 1);
        g.fillRoundedRect(r.x, r.y, r.w, r.h + 4, 16);
        g.fillStyle(COLORS.uiPanelLight, 1);
        g.fillRoundedRect(r.x, r.y, r.w, r.h - 2, 16);
        // fundo da barra também "segura" cliques (não constrói por baixo dela)
        scene.add.zone(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h).setInteractive();

        const b = TOWER_BAR;
        this.cards = TOWER_ORDER.map((type, i) => {
            const cx = b.x + (i === 0 ? -1 : 1) * (b.cardW / 2 + b.gap / 2);
            return this.card(type, i + 1, cx, b.y);
        });
    }

    card (type, key, x, y) {
        const scene = this.scene;
        const stats = BALANCE.towers[type];
        const W = TOWER_BAR.cardW, H = TOWER_BAR.cardH;
        const c = scene.add.container(x, y);
        c.type = type;
        c.homeY = y;

        const bg = scene.add.graphics();
        c.drawBg = (state) => {
            const face = { idle: 0x584078, hover: 0x6b4f90, active: 0x2f9fbf, off: 0x3f3450 }[state];
            const edge = { idle: 0x2a1f3d, hover: 0x2a1f3d, active: 0x1b6f87, off: 0x2a2235 }[state];
            bg.clear();
            bg.fillStyle(COLORS.outline, 1);
            bg.fillRoundedRect(-W / 2 - 3, -H / 2 - 3, W + 6, H + 8, 14);
            bg.fillStyle(edge, 1);
            bg.fillRoundedRect(-W / 2, -H / 2, W, H + 3, 12);
            bg.fillStyle(face, 1);
            bg.fillRoundedRect(-W / 2, -H / 2, W, H - 3, 12);
            bg.fillStyle(0xffffff, state === 'active' ? 0.3 : 0.1);
            bg.fillRoundedRect(-W / 2 + 8, -H / 2 + 5, W * 0.45, 4, 2);
            bg.fillStyle(COLORS.outline, 0.35);
            bg.fillEllipse(-W / 2 + 40, H / 2 - 12, 62, 16);
        };
        c.add(bg);

        const iconScale = type === 'laserCrossbow' ? 0.52 : 0.44;
        c.icon = towerPreview(scene, type, -W / 2 + 40, H / 2 - 10, iconScale);
        c.add(c.icon);

        const name = scene.add.text(-W / 2 + 78, -10, stats.name, textStyle(13, '#f1e6cf', {
            wordWrap: { width: W - 84 }, lineSpacing: -4
        })).setOrigin(0, 0.5);
        const ether = makeArt(scene, -W / 2 + 86, 20, 'icon-ether', 0.42);
        c.costText = scene.add.text(-W / 2 + 97, 20, `${stats.cost}`, numberStyle(20, '#5ef0ff')).setOrigin(0, 0.5);

        // atalho de teclado
        const badge = scene.add.graphics();
        badge.fillStyle(COLORS.outline, 1).fillCircle(-W / 2 + 6, -H / 2 + 6, 11);
        badge.fillStyle(0xf1e6cf, 1).fillCircle(-W / 2 + 6, -H / 2 + 6, 8.5);
        const keyText = scene.add.text(-W / 2 + 6, -H / 2 + 6, `${key}`, numberStyle(13, '#1e1512', { strokeThickness: 0, shadow: undefined })).setOrigin(0.5);
        c.add([name, ether, c.costText, badge, keyText]);

        c.setSize(W, H);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerover', () => { c.hover = true; this.refresh(c); });
        c.on('pointerout', () => { c.hover = false; this.refresh(c); });
        c.on('pointerdown', (pointer) => {
            if (!this.enabled || pointer.rightButtonDown()) { return; }
            if (!c.affordable) { this.deny(c); return; }
            scene.game.events.emit(EVT.PLACEMENT_START, { type, drag: true });
        });
        c.on('pointerup', (pointer) => {
            scene.game.events.emit(EVT.PLACEMENT_RELEASE, { moved: pointer.getDistance() > DRAG_THRESHOLD });
        });
        return c;
    }

    // Tecla 1/2.
    select (index) {
        const c = this.cards[index];
        if (!c || !this.enabled) { return; }
        if (!c.affordable) { this.deny(c); return; }
        this.scene.game.events.emit(EVT.PLACEMENT_START, { type: c.type, drag: false });
    }

    setEther (ether) {
        this.ether = ether;
        this.cards.forEach((c) => this.refresh(c));
    }

    setActive (type) {
        this.activeType = type;
        this.cards.forEach((c) => this.refresh(c));
    }

    setEnabled (enabled) {
        this.enabled = enabled;
        this.cards.forEach((c) => this.refresh(c));
    }

    refresh (c) {
        c.affordable = this.ether >= BALANCE.towers[c.type].cost;
        const active = this.activeType === c.type;
        const off = !c.affordable || !this.enabled;
        c.drawBg(active ? 'active' : off ? 'off' : c.hover ? 'hover' : 'idle');
        c.setAlpha(off && !active ? 0.6 : 1);
        tintPreview(c.icon, off && !active ? 0x7a7580 : null);
        c.costText.setColor(c.affordable ? '#5ef0ff' : '#ff6b7a');
        const lift = active ? -8 : (c.hover && !off ? -4 : 0);
        this.scene.tweens.killTweensOf(c);
        this.scene.tweens.add({ targets: c, y: c.homeY + lift, duration: 140, ease: 'Quad.easeOut' });
    }

    deny (c) {
        const scene = this.scene;
        scene.tweens.killTweensOf(c);
        c.x = c.homeX = c.homeX ?? c.x;
        scene.tweens.add({ targets: c, x: c.homeX + 7, duration: 45, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
        scene.game.events.emit(EVT.NOT_ENOUGH_ETHER);
    }
}
