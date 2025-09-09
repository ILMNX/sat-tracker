import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // if you're using React
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),        // remove if not using React
    tailwindcss()
  ],
});
