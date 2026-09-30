import { defineConfig } from 'vite';
import revisor from './tools/revisor/plugin.js';

export default defineConfig({
    base: './',
    // revisor de pixel art (T23): endpoints locais /__revisor/* só no servidor de desenvolvimento
    plugins: [revisor()],
    // `npm run dev` abre o navegador; defina NO_OPEN=1 para não abrir (usado nos testes automatizados).
    server: { port: 5173, open: !process.env.NO_OPEN },
    build: {
        chunkSizeWarningLimit: 2000
    }
});
