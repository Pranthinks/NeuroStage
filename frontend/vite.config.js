import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/upload': 'http://localhost:5000',
      '/get_folders': 'http://localhost:5000',
      '/classify_folder': 'http://localhost:5000',
      '/get_classified_files': 'http://localhost:5000',
      '/download_file': 'http://localhost:5000',
      '/download_classification': 'http://localhost:5000',
      '/view_file': 'http://localhost:5000'
    }
  }
})