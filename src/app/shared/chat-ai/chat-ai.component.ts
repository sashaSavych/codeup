import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

import { ChatAiService } from '../../core/chat-ai/chat-ai.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: number;
}

@Component({
  selector: 'cu-chat-ai',
  standalone: true,
  imports: [DrawerModule, ButtonModule],
  templateUrl: './chat-ai.component.html',
  styleUrl: './chat-ai.component.scss',
})
export class ChatAiComponent {
  private readonly supabase = inject(SupabaseService);
  readonly chatAi = inject(ChatAiService);

  private readonly messageScroll = viewChild<ElementRef<HTMLElement>>('messageScroll');

  readonly user = this.supabase.user;

  readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      at: 0,
      content: 'Привіт! Постав запитання, з радістю допоможу!',
    },
  ]);

  readonly draft = signal('');
  readonly sending = signal(false);

  constructor() {
    effect(() => {
      if (!this.supabase.user()) {
        this.chatAi.close();
      }
    });

    effect(() => {
      if (this.chatAi.visible()) {
        setTimeout(() => this.scrollMessagesToBottom(), 0);
      }
    });
  }

  private scrollMessagesToBottom(): void {
    const el = this.messageScroll()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  updateDraft(value: string): void {
    this.draft.set(value);
  }

  /** Enter sends; Shift+Enter inserts a newline (default textarea behaviour). */
  onComposerEnter(ev: Event): void {
    if (!(ev instanceof KeyboardEvent)) {
      return;
    }
    if (ev.shiftKey) {
      return;
    }
    ev.preventDefault();
    void this.send();
  }

  async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.sending()) {
      return;
    }

    this.sending.set(true);
    const userMsg: ChatMessage = { role: 'user', content: text, at: Date.now() };
    this.messages.update((m) => [...m, userMsg]);
    this.draft.set('');

    const endpoint = environment.chatAiEndpoint?.trim();
    const token = this.supabase.session()?.access_token;

    try {
      if (endpoint && !token) {
        throw new Error('Немає сесії. Увійдіть ще раз.');
      }

      if (endpoint && token) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: this.messages().map(({ role, content }) => ({ role, content })),
          }),
        });

        const raw = await res.text();
        let reply = '';
        if (res.ok) {
          try {
            const json = JSON.parse(raw) as { reply?: string; message?: string; error?: string };
            reply = (json.reply ?? json.message ?? '').trim();
            if (json.error) {
              throw new Error(json.error);
            }
          } catch {
            reply = raw.trim();
          }
        } else {
          throw new Error(raw || res.statusText || 'Помилка сервера');
        }

        if (!reply) {
          reply =
            'Відповідь порожня. Перевір API: очікується JSON з полем `reply` або `message`.';
        }

        this.messages.update((m) => [...m, { role: 'assistant', content: reply, at: Date.now() }]);
      } else {
        this.messages.update((m) => [
          ...m,
          {
            role: 'assistant',
            at: Date.now(),
            content:
              'Зараз чат у демо-режимі. Щоб отримувати відповіді від моделі, додай у `environment.development.ts` адресу `chatAiEndpoint` (POST, тіло з масивом `messages`, відповідь `{ "reply": "..." }`). Навчальні матеріали — у розділі «Теми».',
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не вдалося отримати відповідь.';
      this.messages.update((m) => [
        ...m,
        {
          role: 'assistant',
          at: Date.now(),
          content: `Сталася помилка: ${msg}`,
        },
      ]);
    } finally {
      this.sending.set(false);
      setTimeout(() => this.scrollMessagesToBottom(), 0);
    }
  }
}
