import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    // `npm run dev` abre o navegador; defina NO_OPEN=1 para não abrir (usado nos testes automatizados).
    server: { port: 5173, open: !process.env.NO_OPEN },
    build: {
        chunkSizeWarningLimit: 2000
    }
});
