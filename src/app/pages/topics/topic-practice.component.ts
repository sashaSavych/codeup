import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { TopicsService } from '../../core/topics/topics.service';

@Component({
  selector: 'cu-topic-practice',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './topic-practice.component.html',
  styleUrl: './topic-practice.component.scss',
})
export class TopicPracticeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly topicsService = inject(TopicsService);

  readonly topicResult = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) => from(this.topicsService.getBySlug(slug))),
    ),
  );
}
