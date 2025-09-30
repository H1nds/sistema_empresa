import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Cualquier llamada a /api/tipo-cambio-sunat en dev
            // se reescribe y se envía a https://api.apis.net.pe/v1/tipo-cambio-sunat 
            '/api/tipo-cambio-sunat': {
                target: 'https://api.apis.net.pe/v1',
                changeOrigin: true,
                rewrite: path => path.replace(
                    /^\/api\/tipo-cambio-sunat/,
                    '/tipo-cambio-sunat'
                ),
                secure: true
            }
        }
    }
});
