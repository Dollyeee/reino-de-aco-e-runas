import { makeArt, makeSprite, anchor } from '../world/art.js';
import { towerPixel } from '../config/art.js';
import { ARM_ANGLES, armFrameFor, headFrameFor } from '../config/towerArt.js';

const PREVIEW_ANGLE = -0.35;

// Miniatura da torre montada a partir da mesma arte do jogo (barra de torres e prévia de posicionamento).
// A origem do Container é o ponto de contato da torre com o chão.
export function towerPreview (scene, type, x, y, scale = 1, breathe = true) {
    const k = scale;
    const box = scene.add.container(x, y);
    const px = towerPixel(type);
    if (px && type === 'laserCrossbow') {
        const m = px.headMount;
        box.add([
            makeArt(scene, 0, 0, px.baseKey, k),
            makeSprite(scene, m.x * k, m.y * k, px.pieceKey, k).setFrame(headFrameFor(PREVIEW_ANGLE).frame)
        ]);
    } else if (px) {
        const p = px.armPivot, f = armFrameFor(PREVIEW_ANGLE), a = ARM_ANGLES[f];
        const ox = px.orb.x * Math.cos(a) - px.orb.y * Math.sin(a), oy = px.orb.x * Math.sin(a) + px.orb.y * Math.cos(a);
        box.add([
            makeArt(scene, 0, 0, px.baseKey, k),
            makeSprite(scene, p.x * k, p.y * k, px.pieceKey, k).setFrame(f),
            makeArt(scene, (p.x + ox) * k, (p.y + oy) * k, 'projectile-plasma', k * 0.45)
        ]);
    } else if (type === 'laserCrossbow') {
        const base = makeArt(scene, 0, 0, 'tower-crossbow-base', k);
        const m = anchor('tower-crossbow-base', 'headMount');
        const head = makeArt(scene, m.x * k, m.y * k, 'tower-crossbow-head', k).setRotation(PREVIEW_ANGLE);
        box.add([base, head]);
    } else {
        const base = makeArt(scene, 0, 0, 'tower-catapult-base', k);
        const p = anchor('tower-catapult-base', 'armPivot');
        const orb = anchor('tower-catapult-arm', 'orb');
        const arm = scene.add.container(p.x * k, p.y * k).setRotation(PREVIEW_ANGLE);
        arm.add([
            makeArt(scene, 0, 0, 'tower-catapult-arm', k),
            makeArt(scene, orb.x * k, orb.y * k, 'projectile-plasma', k * 0.9)
        ]);
        box.add([base, arm]);
    }
    if (breathe) {
        scene.tweens.add({ targets: box, scaleY: 1.04, scaleX: 0.98, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    return box;
}

// Aplica (ou remove) um tint em todas as imagens dentro da miniatura.
export function tintPreview (box, color) {
    const walk = (obj) => {
        if (obj.list) { obj.list.forEach(walk); return; }
        if (color === null) { obj.clearTint(); } else { obj.setTint(color); }
    };
    walk(box);
}
