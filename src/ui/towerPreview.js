import { makeArt, anchor } from '../world/art.js';

// Miniatura da torre montada a partir dos mesmos SVGs do jogo (barra de torres e prévia de posicionamento).
// A origem do Container é o ponto de contato da torre com o chão.
export function towerPreview (scene, type, x, y, scale = 1, breathe = true) {
    const k = scale;
    const box = scene.add.container(x, y);
    if (type === 'laserCrossbow') {
        const base = makeArt(scene, 0, 0, 'tower-crossbow-base', k);
        const m = anchor('tower-crossbow-base', 'headMount');
        const head = makeArt(scene, m.x * k, m.y * k, 'tower-crossbow-head', k).setRotation(-0.35);
        box.add([base, head]);
    } else {
        const base = makeArt(scene, 0, 0, 'tower-catapult-base', k);
        const p = anchor('tower-catapult-base', 'armPivot');
        const orb = anchor('tower-catapult-arm', 'orb');
        const arm = scene.add.container(p.x * k, p.y * k).setRotation(-0.35);
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
