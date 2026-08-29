import { defineConfig } from '#q-app/wrappers'

export default defineConfig((ctx) => {
  return {
    boot: ['pinia', 'supabase'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
      'mdi-v7',
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      // variáveis com prefixo VITE_ são expostas automaticamente pelo Vite via import.meta.env
    },

    devServer: {
      open: true,
      port: 9000,
    },

    framework: {
      config: {
        notify: {
          position: 'top-right',
          timeout: 3000,
        },
      },
      plugins: ['Notify', 'Loading', 'Dialog', 'Dark'],
    },

    animations: [],

    pwa: {
      workboxMode: 'GenerateSW',
      manifest: {
        name: 'Atende',
        short_name: 'Atende',
        description: 'Agendamento para profissionais de saúde autônomos',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAFAF9',
        theme_color: '#1976D2',
        icons: [],
      },
    },
  }
})
