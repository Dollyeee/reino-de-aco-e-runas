import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { COLORS, DEPTH } from '../config/visual.js';
import { EVT } from '../config/events.js';
import { addArt, textStyle } from '../world/art.js';
import { towerPreview, tintPreview } from '../ui/towerPreview.js';
import { PLATFORM_OFFSET } from './Tower.js';

const DRAG_THRESHOLD = 16;       // px que o ponteiro precisa andar para contar como "arrastar e soltar"
const INVALID_TINT = 0xff6b5a;

// Modo posicionamento de torres (estilo Bloons TD).
// Uma prévia translúcida segue o ponteiro; ciano = local válido, vermelho = inválido.
// Clique esquerdo constrói; botão direito ou ESC cancela; Shift mantém o modo; no toque, arraste a carta e solte.
export default class TowerPlacer {
    constructor (scene, rules) {
        this.scene = scene;
        this.rules = rules;
        this.type = null;
        this.dragArmed = false;
        this.valid = false;
        this.lastCheck = null;
        this.pos = new Phaser.Math.Vector2();

        this.range = scene.add.graphics().setDepth(DEPTH.RANGE).setVisible(false);
        this.reasonText = scene.add.text(0, 0, '', textStyle(15, '#ffb3a8', { strokeThickness: 4 }))
            .setOrigin(0.5, 0).setDepth(DEPTH.FLOATING_TEXT).setVisible(false);
    }

    get active () { return this.type !== null; }

    start (type, drag = false) {
        if (this.type === type && !drag) { this.cancel(); return; }   // mesma tecla/carta de novo = cancela
        this.clearGhost();
        this.type = type;
        this.dragArmed = drag;
        this.lastCheck = null;

        const scene = this.scene;
        this.ghost = scene.add.container(0, 0).setDepth(DEPTH.FX - 100);
        this.ghostPlatform = addArt(scene, 0, 0, 'build-slot');
        this.ghostTower = towerPreview(scene, type, 0, PLATFORM_OFFSET, 1, false);
        this.ghost.add([this.ghostPlatform, this.ghostTower]);
        this.ghost.setAlpha(0.72);

        this.range.setVisible(true);
        this.update();
        scene.game.events.emit(EVT.PLACEMENT_CHANGED, type);
    }

    cancel () {
        if (!this.active) { return; }
        this.clearGhost();
        this.type = null;
        this.dragArmed = false;
        this.range.clear().setVisible(false);
        this.reasonText.setVisible(false);
        this.scene.game.events.emit(EVT.PLACEMENT_CHANGED, null);
    }

    clearGhost () {
        if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
    }

    worldPointer (pointer = this.scene.input.activePointer) {
        return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, this.pos);
    }

    // Chamado todo frame pela GameScene enquanto o modo está ativo.
    update () {
        if (!this.active) { return; }
        const p = this.worldPointer();
        const x = Math.round(p.x), y = Math.round(p.y);
        this.ghost.setPosition(x, y);

        const check = this.rules.check(this.type, x, y, this.scene.towers);
        const stats = BALANCE.towers[this.type];
        const affordable = this.scene.state.ether >= stats.cost;
        const ok = check.ok && affordable;
        const reason = !check.ok ? check.reason : (!affordable ? 'Éter insuficiente' : '');

        if (!this.lastCheck || this.lastCheck.ok !== ok || this.lastCheck.reason !== reason) {
            tintPreview(this.ghost, ok ? null : INVALID_TINT);
            this.reasonText.setText(reason).setVisible(!ok && reason !== '');
            this.lastCheck = { ok, reason };
        }
        this.valid = ok;
        this.reasonText.setPosition(x, y + 26);
        this.drawRange(x, y, stats.range, stats.footprintRadius, ok);
    }

    drawRange (x, y, radius, footprint, ok) {
        const color = ok ? COLORS.cyan : COLORS.red;
        const g = this.range;
        g.clear();
        g.setPosition(x, y);
        g.fillStyle(color, ok ? 0.12 : 0.1);
        g.fillCircle(0, 0, radius);
        g.lineStyle(3, color, 0.8);
        g.strokeCircle(0, 0, radius);
        // área ocupada no chão (visão 3/4 → elipse)
        g.lineStyle(2, color, 0.9);
        g.strokeEllipse(0, 0, footprint * 2, footprint);
    }

    // ------------------------------------------------------------ entrada

    onPointerDown (pointer) {
        this.dragArmed = false;
        if (pointer.rightButtonDown()) {
            this.cancel();
            return;
        }
        this.tryBuild(pointer);
    }

    // Solto sobre o mapa depois de arrastar a carta = construir ali.
    onPointerUp (pointer) {
        if (!this.active || !this.dragArmed) { return; }
        this.dragArmed = false;
        if (pointer.getDistance() > DRAG_THRESHOLD) {
            this.tryBuild(pointer);
        }
    }

    // Ponteiro solto sobre a própria carta: clique (continua no modo) ou arrasto desistido (cancela).
    onReleaseOnBar (moved) {
        if (!this.active) { return; }
        if (moved) { this.cancel(); } else { this.dragArmed = false; }
    }

    tryBuild (pointer) {
        const p = this.worldPointer(pointer);
        const x = Math.round(p.x), y = Math.round(p.y);
        const type = this.type;
        const check = this.rules.check(type, x, y, this.scene.towers);
        if (!check.ok) {
            this.reject(check.reason);
            return false;
        }
        if (this.scene.state.ether < BALANCE.towers[type].cost) {
            this.scene.game.events.emit(EVT.NOT_ENOUGH_ETHER);
            this.reject('Éter insuficiente');
            return false;
        }
        this.scene.buildTower(type, x, y);
        const keep = pointer.event && pointer.event.shiftKey;
        if (keep) {
            this.lastCheck = null;   // força recalcular (a torre nova agora bloqueia o lugar)
        } else {
            this.cancel();
        }
        return true;
    }

    // Recusa: a prévia treme e o motivo pisca.
    reject (reason) {
        if (!this.ghost) { return; }
        const scene = this.scene;
        scene.tweens.killTweensOf(this.ghostTower);
        this.ghostTower.x = 0;
        scene.tweens.add({ targets: this.ghostTower, x: 6, duration: 45, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
        this.reasonText.setText(reason).setVisible(true).setScale(1.25);
        scene.tweens.add({ targets: this.reasonText, scale: 1, duration: 200, ease: 'Quad.easeOut' });
    }

    destroy () {
        this.cancel();
        this.range.destroy();
        this.reasonText.destroy();
    }
}
