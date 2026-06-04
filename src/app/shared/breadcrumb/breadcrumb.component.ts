import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string | unknown[];
}

@Component({
  selector: 'cu-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="cu-breadcrumb text-sm text-slate-600" aria-label="Навігація">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        @for (item of items(); track item.label; let last = $last) {
          <li class="inline-flex items-center gap-1">
            @if (!last && item.link) {
              <a [routerLink]="item.link" class="text-teal-700 underline hover:text-teal-900"> {{ item.label }} </a>
              <span aria-hidden="true" class="text-slate-400">→</span>
            } @else {
              <span class="font-medium text-slate-800" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly items = input.required<BreadcrumbItem[]>();
}
