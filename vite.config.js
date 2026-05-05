import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Parse .env_api if it exists
let groqApiKey = '';
try {
  const envApiFile = path.resolve(process.cwd(), '.env_api');
  if (fs.existsSync(envApiFile)) {
    const content = fs.readFileSync(envApiFile, 'utf-8');
    const match = content.match(/GROQ_API_KEY=["']?([^"'\n]+)["']?/);
    if (match) groqApiKey = match[1];
  }
} catch (e) {
  console.error("Failed to parse .env_api", e);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(groqApiKey)
  }
})
