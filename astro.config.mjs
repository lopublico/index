// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://lopublico.es',

  // Fuentes auto-alojadas: Astro las descarga y subsetea en el build, genera
  // métricas de fallback (sin CLS) y las sirve desde el propio dominio.
  // Elimina la petición bloqueante a fonts.googleapis.com.
  fonts: [
    {
      name: 'Geist',
      cssVariable: '--font-sans',
      provider: fontProviders.google(),
      weights: ['400', '500', '600', '700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
      optimizedFallbacks: true,
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.google(),
      weights: ['400'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
      optimizedFallbacks: true,
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
