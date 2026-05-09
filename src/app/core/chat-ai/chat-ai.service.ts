import { Injectable, signal } from '@angular/core';

/** Controls the global AI chat drawer from the shell header. */
@Injectable({ providedIn: 'root' })
export class ChatAiService {
  /** Drawer visibility (only meaningful while the user is signed in). */
  visible = signal(false);

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }
}
