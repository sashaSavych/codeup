import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { editor as MonacoEditorApi } from 'monaco-editor';

import type { VerificationResult } from '../../core/practice/code-task.model';

type MonacoModule = typeof import('monaco-editor');

@Component({
  selector: 'cu-code-editor',
  standalone: true,
  template: `<div #host class="cu-code-editor-host"></div>`,
  styleUrl: './code-editor.component.scss',
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  readonly initialCode = input.required<string>();

  readonly codeChange = output<string>();

  /** True once Monaco has created the editor (safe to read/write code). */
  readonly editorReady = signal(false);

  private editor: MonacoEditorApi.IStandaloneCodeEditor | null = null;
  private monacoApi: MonacoModule | null = null;
  private ignoreNextEmit = false;
  private monacoReady: Promise<MonacoModule> | null = null;

  constructor() {
    effect(() => {
      const next = this.initialCode();
      if (this.editor) {
        this.setProgrammaticValue(next);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const monacoApi = await this.ensureMonaco();
    this.monacoApi = monacoApi;
    const el = this.host().nativeElement;
    this.zone.runOutsideAngular(() => {
      this.editor = monacoApi.editor.create(el, {
        value: this.initialCode(),
        language: 'javascript',
        theme: 'vs',
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
      });
      this.editor.onDidChangeModelContent(() => {
        if (!this.editor) {
          return;
        }
        if (!this.ignoreNextEmit) {
          this.clearVerificationMarkers();
        }
        const v = this.editor.getValue();
        if (this.ignoreNextEmit) {
          return;
        }
        this.zone.run(() => this.codeChange.emit(v));
      });
    });
    this.zone.run(() => this.editorReady.set(true));
  }

  ngOnDestroy(): void {
    this.editor?.dispose();
    this.editor = null;
    this.monacoApi = null;
    this.editorReady.set(false);
  }

  setProgrammaticValue(value: string): void {
    if (!this.editor) {
      return;
    }
    this.ignoreNextEmit = true;
    this.clearVerificationMarkers();
    this.editor.setValue(value);
    queueMicrotask(() => {
      this.ignoreNextEmit = false;
    });
  }

  getValue(): string {
    return this.editor?.getValue() ?? '';
  }

  /** Inline squiggles + scroll to first marker when verification fails. */
  applyVerificationResult(result: VerificationResult): void {
    const editor = this.editor;
    const monaco = this.monacoApi;
    if (!editor || !monaco) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    if (result.ok) {
      monaco.editor.setModelMarkers(model, 'verify', []);
      return;
    }
    const msg = result.message ?? 'Помилка.';
    const maxLine = model.getLineCount();
    const line = Math.min(Math.max(1, result.markerLine ?? 1), maxLine);
    const maxCol = model.getLineMaxColumn(line);
    const col = Math.min(Math.max(1, result.markerColumn ?? 1), maxCol);
    monaco.editor.setModelMarkers(model, 'verify', [
      {
        severity: monaco.MarkerSeverity.Error,
        message: msg,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: maxCol,
      },
    ]);
    editor.revealLineInCenter(line);
  }

  clearVerificationMarkers(): void {
    const editor = this.editor;
    const monaco = this.monacoApi;
    if (!editor || !monaco) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    monaco.editor.setModelMarkers(model, 'verify', []);
  }

  /** AMD loader from `/monaco/vs/loader.js` (assets); avoids bundling monaco .ttf via esbuild. */
  private ensureMonaco(): Promise<MonacoModule> {
    if (this.monacoReady) {
      return this.monacoReady;
    }
    this.monacoReady = (async () => {
      const g = globalThis as typeof globalThis & {
        require?: AMDRequire;
        monaco?: MonacoModule;
      };
      if (!g.require) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = '/monaco/vs/loader.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Monaco loader'));
          document.head.appendChild(s);
        });
      }
      const req = g.require;
      if (!req) {
        throw new Error('Monaco AMD loader missing');
      }
      req.config({ paths: { vs: '/monaco/vs' } });
      await new Promise<void>((resolve, reject) => {
        req(['vs/editor/editor.main'], () => resolve(), (err) => reject(err ?? new Error('Monaco load failed')));
      });
      const api = g.monaco;
      if (!api) {
        throw new Error('Monaco global missing after load');
      }
      return api;
    })();
    return this.monacoReady;
  }
}

interface AMDRequire {
  config(config: { paths: Record<string, string> }): void;
  (deps: string[], onLoad: () => void, onError?: (err: unknown) => void): void;
}
