import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Dev server config
    return {
      root: 'demo',
      server: {
        port: 3000,
        open: true,
        fs: {
          // Allow serving files from project root and parent directories
          allow: ['..', '.'],
        },
        watch: {
          ignored: ['!**/dist/**'], // Watch dist for rebuilds
        },
      },
      resolve: {
        alias: {
          '@dist': path.resolve(__dirname, 'dist'),
        },
      },
    };
  } else {
    // Build config for library
    return {
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'QuillImageResizer',
          fileName: (format) => `index.${format}.js`,
          formats: ['es', 'cjs'],
        },
        outDir: path.resolve(__dirname, 'dist'),
        rollupOptions: {
          external: ['quill'], // don't bundle quill
        },
      },
    };
  }
});