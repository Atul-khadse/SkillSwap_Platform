import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   // server: {
//   //   port: 3000,
//   // },
// })






export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer', 'stream', 'crypto', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  define: {
    'global': 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})