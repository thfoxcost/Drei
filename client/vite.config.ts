import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  ssr: {
    noExternal: ["react-country-flag"],
  },
  plugins: [
    // The devtools plugin is a development-only dependency: registering it
    // unconditionally puts it in the production build graph and ships its
    // runtime to users. `vite build` runs with mode "production".
    ...(mode === "development" ? [devtools()] : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
}))

export default config
