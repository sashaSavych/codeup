import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

import type { TopicSummary } from '../../core/topics/topic.model';
import { TopicsService } from '../../core/topics/topics.service';

@Component({
  selector: 'cu-topics',
  standalone: true,
  imports: [RouterLink, ButtonModule, CardModule, MessageModule],
  templateUrl: './topics.component.html',
  styleUrl: './topics.component.scss',
})
export class TopicsComponent {
  private readonly topicsService = inject(TopicsService);

  readonly topics = signal<TopicSummary[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const rows = await this.topicsService.listSummaries();
      this.topics.set(rows);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Не вдалося завантажити теми.');
    } finally {
      this.loading.set(false);
    }
  }
}
