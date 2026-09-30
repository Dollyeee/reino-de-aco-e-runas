// Texturas procedurais pequenas (sombras, partículas, anéis). Não são "arte de personagem",
// por isso ficam no código em vez de public/assets/.

function canvasTexture (scene, key, w, h, draw) {
    if (scene.textures.exists(key)) { return; }
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    draw(ctx, w, h);
    tex.refresh();
}

export function createProceduralTextures (scene) {
    // Sombra elíptica suave
    canvasTexture(scene, 'shadow', 128, 64, (ctx, w, h) => {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(1, h / w);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        g.addColorStop(0, 'rgba(30,14,40,1)');
        g.addColorStop(0.55, 'rgba(30,14,40,0.9)');
        g.addColorStop(1, 'rgba(30,14,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Ponto de brilho suave (partículas aditivas, halos)
    canvasTexture(scene, 'dot', 64, 64, (ctx, w) => {
        const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
    });

    // Faísca em estrela de 4 pontas
    canvasTexture(scene, 'spark', 48, 48, (ctx, w) => {
        const c = w / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(c, 0);
        ctx.quadraticCurveTo(c, c, w, c);
        ctx.quadraticCurveTo(c, c, c, w);
        ctx.quadraticCurveTo(c, c, 0, c);
        ctx.quadraticCurveTo(c, c, c, 0);
        ctx.fill();
    });

    // Pedacinho de destroço (branco com contorno — a cor vem do tint)
    canvasTexture(scene, 'chunk', 20, 20, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2b1d33';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(3, 3, 14, 14, 4);
        ctx.fill();
        ctx.stroke();
    });

    // Anel de onda de choque
    canvasTexture(scene, 'ring', 128, 128, (ctx, w) => {
        const c = w / 2;
        const g = ctx.createRadialGradient(c, c, c * 0.62, c, c, c);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.55, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
    });

    // Bolha do escudo de energia
    canvasTexture(scene, 'shield', 256, 256, (ctx, w) => {
        const c = w / 2;
        const g = ctx.createRadialGradient(c, c, 0, c, c, c);
        g.addColorStop(0, 'rgba(120,250,255,0.05)');
        g.addColorStop(0.7, 'rgba(120,250,255,0.15)');
        g.addColorStop(0.93, 'rgba(160,255,255,0.75)');
        g.addColorStop(1, 'rgba(160,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, w);
        // hexágonos sutis
        ctx.strokeStyle = 'rgba(200,255,255,0.18)';
        ctx.lineWidth = 2;
        const r = 14;
        for (let y = 0; y < w + r; y += r * 1.5) {
            for (let x = 0; x < w + r; x += r * Math.sqrt(3)) {
                const ox = (Math.round(y / (r * 1.5)) % 2) * r * Math.sqrt(3) / 2;
                const px = x + ox, py = y;
                if (Math.hypot(px - c, py - c) > c * 0.92) { continue; }
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 3 * i + Math.PI / 6;
                    const hx = px + Math.cos(a) * r * 0.9, hy = py + Math.sin(a) * r * 0.9;
                    if (i === 0) { ctx.moveTo(hx, hy); } else { ctx.lineTo(hx, hy); }
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    });

    // Círculo de runas (materialização das torres): anéis + glifos, branco (a cor vem do tint)
    canvasTexture(scene, 'rune-circle', 256, 256, (ctx, w) => {
        const c = w / 2;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(c, c, c - 8, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(c, c, c - 36, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(c, c, c - 58, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        // glifos entre os anéis
        ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 / 12) * i;
            ctx.save();
            ctx.translate(c + Math.cos(a) * (c - 22), c + Math.sin(a) * (c - 22));
            ctx.rotate(a + Math.PI / 2);
            ctx.beginPath();
            if (i % 3 === 0) { ctx.moveTo(-7, 6); ctx.lineTo(0, -8); ctx.lineTo(7, 6); }
            else if (i % 3 === 1) { ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.moveTo(-6, -2); ctx.lineTo(6, 2); }
            else { ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); }
            ctx.stroke();
            ctx.restore();
        }
    });

    // Marca de queimado no chão
    canvasTexture(scene, 'scorch', 128, 64, (ctx, w, h) => {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(1, h / w);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        g.addColorStop(0, 'rgba(20,40,60,0.85)');
        g.addColorStop(0.5, 'rgba(19,120,150,0.45)');
        g.addColorStop(1, 'rgba(20,40,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
