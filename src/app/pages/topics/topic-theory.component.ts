import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { marked } from 'marked';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import type { TopicDetail } from '../../core/topics/topic.model';
import { TopicsService } from '../../core/topics/topics.service';

marked.setOptions({ gfm: true, breaks: true });

@Component({
  selector: 'cu-topic-theory',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, MessageModule],
  templateUrl: './topic-theory.component.html',
  styleUrl: './topic-theory.component.scss',
})
export class TopicTheoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly topicsService = inject(TopicsService);
  private readonly sanitizer = inject(DomSanitizer);

  /** `undefined` — ще завантажується; `null` — тема не знайдена; інакше рядок з БД. */
  readonly topicResult = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) => from(this.topicsService.getBySlug(slug))),
    ),
  );

  readonly theoryHtml = computed<SafeHtml | null>(() => {
    const t = this.topicResult();
    if (!t?.theory_md) {
      return null;
    }
    const raw = marked.parse(t.theory_md, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
