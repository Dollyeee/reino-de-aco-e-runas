// Caminho dos inimigos: polilinha com cantos arredondados, amostrada em pontos densos.
// Inimigos andam por "distância percorrida" e consultam a posição com getPointAt().

export default class PathTrack {
    constructor (waypoints, cornerRadius = 60, step = 6) {
        this.points = buildRoundedPolyline(waypoints, cornerRadius, step);
        this.cumulative = [0];
        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1], b = this.points[i];
            this.cumulative.push(this.cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
        }
        this.length = this.cumulative[this.cumulative.length - 1];
    }

    // Posição e direção a uma distância do início. `out` é reaproveitado para evitar lixo.
    getPointAt (distance, out = {}) {
        const d = Math.max(0, Math.min(distance, this.length));
        let lo = 0, hi = this.cumulative.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (this.cumulative[mid] <= d) { lo = mid; } else { hi = mid; }
        }
        const a = this.points[lo], b = this.points[hi];
        const segLen = this.cumulative[hi] - this.cumulative[lo] || 1;
        const t = (d - this.cumulative[lo]) / segLen;
        out.x = a.x + (b.x - a.x) * t;
        out.y = a.y + (b.y - a.y) * t;
        out.dx = (b.x - a.x) / segLen;
        out.dy = (b.y - a.y) / segLen;
        return out;
    }

    // Menor distância de um ponto até o caminho (para validar decoração/plataformas).
    distanceTo (x, y) {
        let best = Infinity;
        for (let i = 1; i < this.points.length; i++) {
            best = Math.min(best, distToSegment(x, y, this.points[i - 1], this.points[i]));
        }
        return best;
    }
}

function buildRoundedPolyline (wp, radius, step) {
    const out = [];
    const pushLine = (a, b) => {
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.ceil(len / step));
        for (let i = out.length ? 1 : 0; i <= n; i++) {
            out.push({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n });
        }
    };
    const pushQuad = (a, c, b) => {
        const n = 12;
        for (let i = 1; i <= n; i++) {
            const t = i / n, u = 1 - t;
            out.push({
                x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
                y: u * u * a.y + 2 * u * t * c.y + t * t * b.y
            });
        }
    };

    let cursor = { x: wp[0].x, y: wp[0].y };
    for (let i = 1; i < wp.length - 1; i++) {
        const p = wp[i], prev = wp[i - 1], next = wp[i + 1];
        const inLen = Math.hypot(p.x - prev.x, p.y - prev.y);
        const outLen = Math.hypot(next.x - p.x, next.y - p.y);
        const r = Math.min(radius, inLen / 2, outLen / 2);
        const start = { x: p.x - (p.x - prev.x) / inLen * r, y: p.y - (p.y - prev.y) / inLen * r };
        const end = { x: p.x + (next.x - p.x) / outLen * r, y: p.y + (next.y - p.y) / outLen * r };
        pushLine(cursor, start);
        pushQuad(start, p, end);
        cursor = end;
    }
    pushLine(cursor, wp[wp.length - 1]);
    return out;
}

function distToSegment (px, py, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / len2));
    return Math.hypot(px - (a.x + vx * t), py - (a.y + vy * t));
}
