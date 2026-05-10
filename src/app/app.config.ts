import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

/** Aura uses dark `content` tokens when OS prefers dark — keep tabs strip + panels light. */
const CodeUpTheme = definePreset(Aura, {
  components: {
    tabs: {
      colorScheme: {
        dark: {
          tablist: {
            background: '#f8fafc',
            borderColor: '#e2e8f0',
          },
          tabpanel: {
            background: '#ffffff',
            color: '#334155',
          },
          navButton: {
            background: '#f8fafc',
            color: '#475569',
          },
          tab: {
            color: '#64748b',
            hoverColor: '#334155',
            activeColor: '#0d9488',
          },
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: CodeUpTheme,
      },
    }),
  ],
};
