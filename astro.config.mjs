// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// El manual de marca solo existe en `astro dev` (/manual); no entra en el build.
const manualSoloEnDev = {
  name: 'manual-de-marca',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/manual', entrypoint: './src/dev/manual.astro' });
      }
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://lopublico.es',
  integrations: [manualSoloEnDev],

  // Fuentes auto-alojadas: Astro las descarga y subsetea en el build, genera
  // métricas de fallback (sin CLS) y las sirve desde el propio dominio.
  // Elimina la petición bloqueante a fonts.googleapis.com.
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-sans',
      provider: fontProviders.google(),
      weights: ['400', '500', '600', '700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
      optimizedFallbacks: true,
    },
    {
      name: 'Commit Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.fontsource(),
      weights: ['400', '500'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      name: 'Lora',
      cssVariable: '--font-serif',
      provider: fontProviders.google(),
      weights: ['400', '500'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
      optimizedFallbacks: true,
    },
  ],
});
