import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/tipo-cambio-sunat': {
                target: 'https://api.apis.net.pe/v1/tipo-cambio-sunat',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/tipo-cambio-sunat/, '')
            }
        }
    }
});
