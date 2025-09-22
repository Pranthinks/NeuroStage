import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': 'http://localhost:5000',
      '/get_folders': 'http://localhost:5000',
      '/classify_folder': 'http://localhost:5000',
      '/get_classified_files': 'http://localhost:5000',
      '/download_file': 'http://localhost:5000',
      '/download_classification': 'http://localhost:5000'
    }
  }
})