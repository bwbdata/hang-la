import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    // FFmpeg creates its own module Worker at runtime; pre-bundling it makes
    // Vite look for a generated worker file that does not exist.
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
