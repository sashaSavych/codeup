/**
 * Configure workers before Monaco AMD loader runs. Assets: `/monaco/vs` (angular.json).
 */
export {};

const base = `${typeof document !== 'undefined' ? document.location.origin : ''}/monaco/vs`;

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
