import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  base: '/vestibule/',
  plugins: [
    react(),
    {
      name: 'file-push',
      configureServer(server) {
        server.middlewares.use('/__push', (req, res) => {
          if (req.method !== 'POST') { res.end('ok'); return; }
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const { file, content } = JSON.parse(body);
              const target = path.join(process.cwd(), file);
              fs.writeFileSync(target, content);
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, file }));
            } catch(e) {
              res.end(JSON.stringify({ ok: false, error: e.message }));
            }
          });
        });
      }
    }
  ],
})
