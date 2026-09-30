import { WORLD } from '../config/visual.js';

// Zoom da câmera do mundo (T25, provisório — para ver a arte de perto com o jogo rodando).
//   • roda do mouse: aproxima/afasta em passos INTEIROS (1×, 2×, 3×, 4× o zoom normal: pixel art nítida),
//     mantendo o ponto sob o cursor no mesmo lugar;
//   • teclas + / − aproximam/afastam no centro da tela; 0 volta ao mapa inteiro;
//   • setas movem a câmera; arrastar com o botão do meio também move.
// A câmera não sai do mundo 1280×720 (setBounds). O HUD tem câmera própria (UIScene) e não muda.
const LEVELS = [1, 2, 3, 4];
const PAN_SPEED = 420;            // px do mundo por segundo nas setas (no zoom 1×; diminui com o zoom)

export default class CameraZoom {
    constructor (scene) {
        this.scene = scene;
        this.cam = scene.cameras.main;
        this.base = this.cam.zoom;
        this.level = 0;
        this.cam.setBounds(0, 0, WORLD.width, WORLD.height);

        scene.input.on('wheel', (pointer, over, dx, dy) => this.step(dy < 0 ? 1 : -1, pointer.x, pointer.y));
        scene.input.keyboard.on('keydown', (e) => {
            if (e.key === '+' || e.key === '=') { this.step(1); }
            if (e.key === '-' || e.key === '_') { this.step(-1); }
            if (e.key === '0') { this.reset(); }
        });
        this.keys = scene.input.keyboard.createCursorKeys();
        scene.input.on('pointermove', (p) => {
            if (!p.middleButtonDown() || this.level === 0) { return; }
            this.cam.scrollX -= (p.x - p.prevPosition.x) / this.cam.zoom;
            this.cam.scrollY -= (p.y - p.prevPosition.y) / this.cam.zoom;
        });
    }

    // Muda o nível de zoom mantendo o ponto de tela (sx, sy) sobre o mesmo ponto do mundo.
    step (dir, sx = this.cam.width / 2, sy = this.cam.height / 2) {
        const next = Math.max(0, Math.min(LEVELS.length - 1, this.level + dir));
        if (next === this.level) { return; }
        const cam = this.cam, w = cam.width, h = cam.height;
        // ponto do mundo sob o cursor antes do zoom (a câmera do Phaser dá zoom em volta do centro da vista)
        const wx = cam.scrollX + w / 2 + (sx - w / 2) / cam.zoom;
        const wy = cam.scrollY + h / 2 + (sy - h / 2) / cam.zoom;
        this.level = next;
        cam.setZoom(this.base * LEVELS[next]);
        cam.scrollX = wx - w / 2 - (sx - w / 2) / cam.zoom;
        cam.scrollY = wy - h / 2 - (sy - h / 2) / cam.zoom;
        if (next === 0) { this.reset(); }
    }

    reset () {
        this.level = 0;
        this.cam.setZoom(this.base);
        this.cam.centerOn(WORLD.width / 2, WORLD.height / 2);
    }

    update (dt) {
        if (this.level === 0) { return; }
        const k = this.keys, v = PAN_SPEED * dt / LEVELS[this.level];
        if (k.left.isDown) { this.cam.scrollX -= v; }
        if (k.right.isDown) { this.cam.scrollX += v; }
        if (k.up.isDown) { this.cam.scrollY -= v; }
        if (k.down.isDown) { this.cam.scrollY += v; }
    }
}
