// Revisor de pixel art (T23) — plugin do Vite, SÓ no servidor de desenvolvimento (apply: 'serve').
// Endpoints locais (nada sai da máquina):
//   GET  /__revisor/lista                 sprites do jogo (public/assets/*.png) + rodadas (tools/pixel-art/rodadas/*.png),
//                                         com tamanho, quadro (folhas), hash sha256 e resumo das revisões
//   GET  /__revisor/revisao?nome=X        revisão salva (tools/revisor/revisoes/X.json) ou uma vazia
//   POST /__revisor/revisao?nome=X        grava a revisão; guarda uma cópia do PNG revisado (X.<hash8>.png) = "antes"
//   GET  /__revisor/versoes?nome=X        cópias "antes" salvas para o modo comparar

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

// raiz do projeto = raiz do servidor do Vite (definida em configureServer)
let ROOT = process.cwd();
let DIRS, REV, CONFIG;
function setRoot (root) {
    ROOT = root;
    DIRS = [
        { grupo: 'Sprites do jogo', dir: path.join(ROOT, 'public', 'assets'), url: '/assets/' },
        { grupo: 'Rodadas de trabalho', dir: path.join(ROOT, 'tools', 'pixel-art', 'rodadas'), url: '/tools/pixel-art/rodadas/' }
    ];
    REV = path.join(ROOT, 'tools', 'revisor', 'revisoes');
    CONFIG = path.join(ROOT, 'tools', 'revisor', 'config.json');
}
setRoot(ROOT);

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const safe = (nome) => String(nome || '').replace(/[^a-zA-Z0-9_.-]/g, '');

// tamanho do PNG (cabeçalho IHDR)
function pngSize (file) {
    const b = fs.readFileSync(file);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// quadro de folhas de sprites: JSON irmão (*-walk.json), torres (src/config/towerArt.js) ou 1 quadro
async function frameOf (nome, size, file) {
    const json = file.replace(/\.png$/, '.json');
    if (fs.existsSync(json)) {
        try { const j = JSON.parse(fs.readFileSync(json, 'utf8')); if (Array.isArray(j.frame)) { return j.frame; } } catch (e) { /* segue */ }
    }
    const m = nome.match(/^torre-(besta|catapulta)-([a-z0-9]+)-(base|cabeca|braco)$/);
    if (m) {
        const { TOWER_ART } = await import(pathToFileURL(path.join(ROOT, 'src', 'config', 'towerArt.js')).href);
        const d = TOWER_ART[m[1] === 'besta' ? 'laserCrossbow' : 'plasmaCatapult'][m[2]];
        if (d) { return m[3] === 'base' ? d.base.frame : (d.head || d.arm).frame; }
    }
    return [size.w, size.h];
}

function readRev (nome) {
    const f = path.join(REV, `${safe(nome)}.json`);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

async function lista () {
    const out = [];
    for (const d of DIRS) {
        if (!fs.existsSync(d.dir)) { continue; }
        for (const f of fs.readdirSync(d.dir).filter((x) => x.endsWith('.png')).sort()) {
            const file = path.join(d.dir, f), nome = f.replace(/\.png$/, '');
            const size = pngSize(file);
            const frame = await frameOf(nome, size, file);
            const hash = sha(file);
            const rev = readRev(nome);
            const abertas = rev ? rev.marcacoes.filter((m) => m.status === 'aberta' || m.status === 'esclarecimento').length : 0;
            out.push({
                nome, grupo: d.grupo, url: d.url + f, arquivo: path.relative(ROOT, file).replace(/\\/g, '/'),
                w: size.w, h: size.h, frame, quadros: Math.max(1, Math.floor(size.w / frame[0]) * Math.floor(size.h / frame[1])),
                hash, revisao: rev ? { total: rev.marcacoes.length, abertas, desatualizada: rev.hash !== hash } : null
            });
        }
    }
    const config = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};
    return { sprites: out, destaques: config.destaques || [], chao: '/assets/chao-map01.png', orc: '/assets/orc-b.png' };
}

function body (req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (c) => { data += c; if (data.length > 2e6) { reject(new Error('grande demais')); } });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function send (res, code, obj) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
}

export default function revisor () {
    return {
        name: 'revisor-pixel-art',
        apply: 'serve',
        configureServer (server) {
            setRoot(server.config.root);
            server.middlewares.use(async (req, res, next) => {
                if (!req.url.startsWith('/__revisor/')) { return next(); }
                try {
                    const u = new URL(req.url, 'http://localhost');
                    const nome = safe(u.searchParams.get('nome'));
                    if (u.pathname === '/__revisor/lista') { return send(res, 200, await lista()); }
                    if (u.pathname === '/__revisor/versoes') {
                        const files = fs.existsSync(REV) ? fs.readdirSync(REV).filter((f) => f.startsWith(`${nome}.`) && f.endsWith('.png')) : [];
                        return send(res, 200, files.map((f) => ({ arquivo: f, url: `/tools/revisor/revisoes/${f}`, data: fs.statSync(path.join(REV, f)).mtime })));
                    }
                    if (u.pathname === '/__revisor/revisao' && req.method === 'GET') {
                        return send(res, 200, readRev(nome) || { sprite: nome, hash: null, marcacoes: [] });
                    }
                    if (u.pathname === '/__revisor/revisao' && req.method === 'POST') {
                        const data = JSON.parse(await body(req));
                        const item = (await lista()).sprites.find((s) => s.nome === nome);
                        if (!item) { return send(res, 404, { erro: `sprite desconhecido: ${nome}` }); }
                        fs.mkdirSync(REV, { recursive: true });
                        const rev = {
                            sprite: nome, arquivo: item.arquivo, hash: item.hash, quadro: item.frame,
                            atualizado: new Date().toISOString(), marcacoes: data.marcacoes || []
                        };
                        fs.writeFileSync(path.join(REV, `${nome}.json`), JSON.stringify(rev, null, 2) + '\n');
                        // cópia do PNG revisado: o "antes" do modo comparar
                        const snap = path.join(REV, `${nome}.${item.hash.slice(0, 8)}.png`);
                        if (!fs.existsSync(snap)) { fs.copyFileSync(path.join(ROOT, item.arquivo), snap); }
                        return send(res, 200, { ok: true, hash: item.hash, antes: path.basename(snap) });
                    }
                    return send(res, 404, { erro: 'rota desconhecida' });
                } catch (e) {
                    return send(res, 500, { erro: String(e.message || e) });
                }
            });
        }
    };
}
