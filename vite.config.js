import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) {
          return null
        }

        // Use Vite's OXC transform utility to parse .js files as JSX
        return transformWithOxc(code, id, {
          lang: 'jsx',
        })
      },
    },
    react(),
  ],
})
