import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

import { ChatAiService } from '../../core/chat-ai/chat-ai.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { environment } from '../../../environments/environment';

const CHAT_GEMINI_MODEL_LABEL = 'gemini-2.5-flash';

marked.setOptions({ gfm: true, breaks: true });

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
  private readonly sanitizer = inject(DomSanitizer);
  readonly chatAi = inject(ChatAiService);

  private readonly messageScroll = viewChild<ElementRef<HTMLElement>>('messageScroll');

  readonly user = this.supabase.user;

  readonly messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      at: 0,
      content: `Привіт! Постав запитання про JavaScript, я з радістю допоможу!`,
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

  /** Assistant replies are Markdown from the model; rendered as HTML (trusted server-side origin). */
  assistantMarkdown(content: string): SafeHtml {
    const raw = marked.parse(content ?? '', { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  /**
   * Edge Function may return JSON `{ "error": "..." }` or nested `{ error: { message } }` (e.g. Gemini).
   */
  private formatProviderError(raw: string): string {
    let text = raw.trim();
    try {
      const parsed = JSON.parse(raw) as { error?: string | { message?: string } };
      if (typeof parsed.error === 'string') {
        text = parsed.error;
      } else if (parsed?.error && typeof parsed.error === 'object' && 'message' in parsed.error) {
        text = String((parsed.error as { message?: string }).message ?? text);
      }
    } catch {
      // keep text as raw body
    }

    const lower = text.toLowerCase();
    if (
      lower.includes('exceeded your current quota') ||
      lower.includes('insufficient_quota')
    ) {
      return (
        'Ліміт OpenAI вичерпано або не налаштовано оплату. У власника API-ключа на https://platform.openai.com ' +
        'перевір біллінг і план; після поповнення балансу або зміни ключа в Edge Function чат знову запрацює.'
      );
    }
    if (
      lower.includes('resource_exhausted') ||
      lower.includes('quota exceeded') ||
      lower.includes('rate limit') ||
      lower.includes('free_tier') ||
      lower.includes('generativelanguage.googleapis.com')
    ) {
      if (lower.includes('limit: 0') && lower.includes('free_tier')) {
        return (
          `Для **${CHAT_GEMINI_MODEL_LABEL}** у Google зараз безкоштовна квота = 0 для цього ключа/проєкту (не означає, що модель завжди недоступна). ` +
            'Перевір AI Studio / Cloud: увімкни **Generative Language API**, біллінг за потреби; у Secrets можна тимчасово змінити **GEMINI_MODEL** на іншу доступну модель (наприклад `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`). Док: https://ai.google.dev/gemini-api/docs/rate-limits'
        );
      }
      return (
        `Перевищено квоту або ліміт запитів до Gemini (**${CHAT_GEMINI_MODEL_LABEL}**). Дотримайся часу з повідомлення (Please retry in …), зменш частоту запитів; ` +
          'ліміти: https://ai.google.dev/gemini-api/docs/rate-limits'
      );
    }
    if (lower.includes('api key not valid') || lower.includes('invalid api key')) {
      return `Невірний або прострочений ключ **GEMINI_API_KEY** (потрібен для **${CHAT_GEMINI_MODEL_LABEL}** у Edge Function). Створи новий ключ у Google AI Studio.`;
    }

    return text.length > 800 ? `${text.slice(0, 800)}…` : text;
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
        const apiKey = environment.supabasePublishableKey?.trim();
        if (!apiKey) {
          throw new Error('У environment не задано supabasePublishableKey (потрібен заголовок apikey для Edge Function).');
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: apiKey,
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: this.messages().map(({ role, content }) => ({ role, content })),
          }),
        });

        const raw = await res.text();
        let reply = '';
        if (res.ok) {
          let json: {
            reply?: string;
            message?: string;
            error?: string;
            data?: { reply?: string };
            choices?: Array<{ message?: { content?: string } }>;
          };
          try {
            json = JSON.parse(raw) as typeof json;
          } catch {
            reply = raw.trim();
            json = {};
          }
          if (json && Object.keys(json).length > 0) {
            if (json.error) {
              const errText =
                typeof json.error === 'string'
                  ? json.error
                  : typeof json.error === 'object' && true &&
                      'message' in json.error
                    ? String((json.error as { message: unknown }).message)
                    : JSON.stringify(json.error);
              throw new Error(this.formatProviderError(errText));
            }
            reply = (
              json.reply ??
              json.message ??
              json.data?.reply ??
              json.choices?.[0]?.message?.content ??
              ''
            ).trim();
          }
        } else {
          throw new Error(this.formatProviderError(raw || res.statusText || 'Помилка сервера'));
        }

        if (!reply) {
          reply =
            `Відповідь порожня. Edge Function має повернути JSON з полем \`reply\` або \`message\` (тіло від **${CHAT_GEMINI_MODEL_LABEL}**).`;
        }

        this.messages.update((m) => [...m, { role: 'assistant', content: reply, at: Date.now() }]);
      } else {
        this.messages.update((m) => [
          ...m,
          {
            role: 'assistant',
            at: Date.now(),
            content:
              `Зараз чат у демо-режимі (немає **chatAiEndpoint**). Щоб отримувати відповіді від **${CHAT_GEMINI_MODEL_LABEL}**, додай у \`environment.development.ts\` URL Edge Function \`chat-ai\` (POST, \`messages\`, відповідь \`{ "reply": "..." }\`). Матеріали — у «Темах».`,
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
