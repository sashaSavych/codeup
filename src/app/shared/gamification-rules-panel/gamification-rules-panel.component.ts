import { Component } from '@angular/core';

import { GAMIFICATION_RULES_BULLETS, GAMIFICATION_RULES_INTRO } from '../copy/gamification-rules';

@Component({
  selector: 'cu-gamification-rules-panel',
  standalone: true,
  template: `
    <details class="cu-gamification-rules rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
      <summary class="cursor-pointer text-sm font-semibold text-slate-800">Як нараховуються бали</summary>
      <p class="mt-3 mb-2 text-sm text-slate-700">{{ intro }}</p>
      <ul class="m-0 list-disc space-y-1 pl-5 text-sm text-slate-700">
        @for (line of bullets; track line) {
          <li>{{ line }}</li>
        }
      </ul>
    </details>
  `,
})
export class GamificationRulesPanelComponent {
  readonly intro = GAMIFICATION_RULES_INTRO;
  readonly bullets = GAMIFICATION_RULES_BULLETS;
}
