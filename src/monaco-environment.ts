/**
 * Configure workers before Monaco AMD loader runs. Assets live under `monaco/vs` (angular.json),
 * resolved against `<base href>` so GitHub Pages (`/repo/`) loads workers from `/repo/monaco/vs/...`.
 */
export {};

function monacoVsBase(): string {
  if (typeof document === 'undefined') {
    return '/monaco/vs';
  }
  return new URL('monaco/vs', document.baseURI).href.replace(/\/$/, '');
}

const base = monacoVsBase();

declare global {
  interface Window {
    MonacoEnvironment?: { getWorkerUrl: (moduleId: string, label: string) => string };
    Monaco?: typeof import('monaco-editor');
    require?: AMDRequire;
  }
}

interface AMDRequire {
  config(config: { paths: Record<string, string> }): void;
  (deps: string[], onLoad: () => void, onError?: (err: unknown) => void): void;
}

window.MonacoEnvironment = {
  getWorkerUrl(_moduleId: string, label: string): string {
    switch (label) {
      case 'json':
        return `${base}/language/json/json.worker.js`;
      case 'css':
      case 'scss':
      case 'less':
        return `${base}/language/css/css.worker.js`;
      case 'html':
      case 'handlebars':
      case 'razor':
        return `${base}/language/html/html.worker.js`;
      case 'typescript':
      case 'javascript':
        return `${base}/language/typescript/ts.worker.js`;
      default:
        return `${base}/editor/editor.worker.js`;
    }
  },
};
