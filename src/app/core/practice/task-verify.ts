import type { VerificationResult } from './code-task.model';

/** V8/Chrome: `at eval (<anonymous>:3:5)` */
function locationFromStack(stack: string | undefined): { line: number; column: number } | undefined {
  if (!stack) {
    return undefined;
  }
  const m = stack.match(/<anonymous>:(\d+):(\d+)/);
  if (!m) {
    return undefined;
  }
  return { line: parseInt(m[1], 10), column: parseInt(m[2], 10) };
}

function userLineCount(userCode: string): number {
  if (!userCode) {
    return 1;
  }
  return userCode.split('\n').length;
}

/**
 * If the error points into the combined `userCode + harness` eval, only keep a location
 * that falls on the user’s lines; otherwise omit (caller can default to line 1).
 */
function mapStackToUserEditor(
  userCode: string,
  loc: { line: number; column: number } | undefined,
): { line: number; column: number } | undefined {
  if (!loc) {
    return undefined;
  }
  const n = userLineCount(userCode);
  if (loc.line >= 1 && loc.line <= n) {
    return { line: loc.line, column: loc.column };
  }
  return undefined;
}

/**
 * Parse user code for syntax errors (does not run user code).
 * `new Function(source)` compiles; invalid syntax throws before any user `()` call.
 */
function checkUserSyntax(userCode: string): VerificationResult | null {
  try {
    new Function(userCode);
    return null;
  } catch (e) {
    const err = e as Error;
    const loc = mapStackToUserEditor(userCode, locationFromStack(err.stack));
    return {
      ok: false,
      message: err.message || 'Синтаксична помилка у коді.',
      markerLine: loc?.line ?? 1,
      markerColumn: loc?.column ?? 1,
    };
  }
}

/** Concatenate learner code and an IIFE harness; returns structured failure info. */
export function verifyWithHarness(userCode: string, harness: string): VerificationResult {
  const syntax = checkUserSyntax(userCode);
  if (syntax) {
    return syntax;
  }

  const combined = `${userCode}\n${harness}`;
  try {
    new Function(combined)();
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    const msg = err.message || 'Перевірка не пройдена.';
    const locCombined = locationFromStack(err.stack);
    const inUser = mapStackToUserEditor(userCode, locCombined);
    return {
      ok: false,
      message: msg,
      markerLine: inUser?.line ?? 1,
      markerColumn: inUser?.column ?? 1,
    };
  }
}

/** Async task: `giveOk()` must return a Promise resolving to `"ok"`. */
export async function verifyAsyncGiveOk(code: string): Promise<VerificationResult> {
  const syntax = checkUserSyntax(code);
  if (syntax) {
    return syntax;
  }
  try {
    const factory = new Function(`${code}\nreturn giveOk;`);
    const fn = factory();
    if (typeof fn !== 'function') {
      return { ok: false, message: 'Потрібна функція giveOk', markerLine: 1, markerColumn: 1 };
    }
    const p = fn();
    if (!(p instanceof Promise)) {
      return {
        ok: false,
        message: 'giveOk() має повертати Promise',
        markerLine: 1,
        markerColumn: 1,
      };
    }
    const v = await p;
    if (v !== 'ok') {
      return {
        ok: false,
        message: `Promise має резолвитись у рядок "ok", отримано: ${JSON.stringify(v)}`,
        markerLine: 1,
        markerColumn: 1,
      };
    }
    return { ok: true };
  } catch (e) {
    const err = e as Error;
    const loc = mapStackToUserEditor(code, locationFromStack(err.stack));
    return {
      ok: false,
      message: err.message || 'Помилка перевірки.',
      markerLine: loc?.line ?? 1,
      markerColumn: loc?.column ?? 1,
    };
  }
}
