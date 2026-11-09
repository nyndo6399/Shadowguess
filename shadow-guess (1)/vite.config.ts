import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

function syncStandaloneHtml(): Plugin {
  return {
    name: 'sync-standalone-html',
    closeBundle() {
      try {
        const distFile = path.resolve(__dirname, 'dist/index.html');
        const targetPublic = path.resolve(__dirname, 'public/shadow_guess_standalone.html');
        if (fs.existsSync(distFile)) {
          fs.copyFileSync(distFile, targetPublic);
        }
      } catch (err) {
        console.warn('Standalone sync warning:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), syncStandaloneHtml()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
