import type { CodeTask } from './code-task.model';
import { verifyWithHarness } from './task-verify';

export const PRACTICE_TASKS: CodeTask[] = [
  {
    id: 'intro-hello',
    topicSlug: 'intro',
    order: 1,
    title: 'Перший рядок',
    description:
      'Оголоси **константу** `hello` з рядком `"CodeUp"` (лапки як у прикладі). Нічого не виводь у консоль — перевірка читає значення змінної.',
    starterCode: '// const hello = ...\n',
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof hello === 'undefined') throw new Error('Потрібна константа hello');
  if (hello !== 'CodeUp') throw new Error('hello має бути рядком "CodeUp", зараз: ' + JSON.stringify(hello));
})();`,
      ),
  },
  {
    id: 'intro-greet',
    topicSlug: 'intro',
    order: 2,
    title: 'Функція привітання',
    description: 'Напиши функцію **greet(name)**, яка повертає рядок виду `Привіт, Імʼя!` (з пробілом після коми).',
    starterCode: `function greet(name) {
  // поверни рядок
}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof greet !== 'function') throw new Error('Потрібна функція greet(name)');
  if (greet('Оля') !== 'Привіт, Оля!') throw new Error('Перевір вітання для імені "Оля"');
})();`,
      ),
  },
  {
    id: 'syntax-number',
    topicSlug: 'syntax-basics',
    order: 1,
    title: 'Рядок у число',
    description:
      'Оголоси **const n**, присвої йому результат перетворення рядка `"42"` у число (використай **Number(...)**).',
    starterCode: '// const n = ...\n',
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof n === 'undefined') throw new Error('Потрібна константа n');
  if (n !== 42 || typeof n !== 'number') throw new Error('n має бути числом 42');
})();`,
      ),
  },
  {
    id: 'syntax-let',
    topicSlug: 'syntax-basics',
    order: 2,
    title: 'Зміна значення',
    description: 'Оголоси **let score = 10**, потім збільш score на **5** другим рядком.',
    starterCode: `let score = 10;
// score = ...
`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof score === 'undefined') throw new Error('Потрібна змінна score');
  if (score !== 15) throw new Error('score має дорівнювати 15, зараз: ' + score);
})();`,
      ),
  },
  {
    id: 'operators-max',
    topicSlug: 'operators',
    order: 1,
    title: 'Більше з двох',
    description: 'Функція **max(a, b)** повертає більше з двох чисел (використай порівняння або Math.max).',
    starterCode: `function max(a, b) {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof max !== 'function') throw new Error('Потрібна функція max(a, b)');
  if (max(3, 7) !== 7) throw new Error('max(3, 7) має бути 7');
  if (max(-1, -5) !== -1) throw new Error('max(-1, -5) має бути -1');
})();`,
      ),
  },
  {
    id: 'operators-even',
    topicSlug: 'operators',
    order: 2,
    title: 'Парність',
    description: 'Функція **isEven(n)** повертає **true**, якщо число парне, інакше **false**.',
    starterCode: `function isEven(n) {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof isEven !== 'function') throw new Error('Потрібна функція isEven(n)');
  if (isEven(4) !== true || isEven(3) !== false) throw new Error('Перевір парність для 4 та 3');
})();`,
      ),
  },
  {
    id: 'control-grade',
    topicSlug: 'control-flow',
    order: 1,
    title: 'Зараховано чи ні',
    description:
      'Функція **passing(score)** повертає рядок **`"зараховано"`**, якщо score **>= 60**, інакше **`"незараховано"`**.',
    starterCode: `function passing(score) {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof passing !== 'function') throw new Error('Потрібна функція passing(score)');
  if (passing(70) !== 'зараховано') throw new Error('score 70 має бути зараховано');
  if (passing(59) !== 'незараховано') throw new Error('score 59 має бути незараховано');
})();`,
      ),
  },
  {
    id: 'loops-sum',
    topicSlug: 'loops',
    order: 1,
    title: 'Сума масиву',
    description: 'Функція **sumNumbers(nums)** приймає масив чисел і повертає їх суму (цикл **for** або інший на твій вибір).',
    starterCode: `function sumNumbers(nums) {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof sumNumbers !== 'function') throw new Error('Потрібна функція sumNumbers(nums)');
  if (sumNumbers([1, 2, 3]) !== 6) throw new Error('Сума [1,2,3] має бути 6');
  if (sumNumbers([]) !== 0) throw new Error('Сума порожнього масиву має бути 0');
})();`,
      ),
  },
  {
    id: 'functions-double',
    topicSlug: 'functions',
    order: 1,
    title: 'Подвоєння',
    description: 'Стрілкова функція **double** приймає **x** і повертає **x * 2**.',
    starterCode: `const double = (x) => {

};\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof double !== 'function') throw new Error('Потрібна стрілкова функція double');
  if (double(5) !== 10) throw new Error('double(5) має бути 10');
})();`,
      ),
  },
  {
    id: 'collections-first',
    topicSlug: 'collections',
    order: 1,
    title: 'Перший елемент',
    description: 'Функція **first(arr)** повертає перший елемент масиву або **undefined**, якщо масив порожній.',
    starterCode: `function first(arr) {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof first !== 'function') throw new Error('Потрібна функція first(arr)');
  if (first([9, 2]) !== 9) throw new Error('Перший елемент [9,2] має бути 9');
  if (first([]) !== undefined) throw new Error('Для [] очікується undefined');
})();`,
      ),
  },
  {
    id: 'collections-person',
    topicSlug: 'collections',
    order: 2,
    title: 'Поле об’єкта',
    description:
      'Створи об’єкт **person** з полями **name** (рядок) та **grade** (число). Значення на твій смак, але **grade** має бути **11** для перевірки.',
    starterCode: `const person = {

};\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof person === 'undefined') throw new Error('Потрібен об\'єкт person');
  if (person.grade !== 11) throw new Error('person.grade має бути числом 11 для автоперевірки');
})();`,
      ),
  },
  {
    id: 'dom-tag',
    topicSlug: 'dom-events',
    order: 1,
    title: 'Тег кнопки',
    description:
      'Функція **buttonTag()** повертає рядок **`"button"`** — як назва HTML-тега для кнопки (маленькими літерами).',
    starterCode: `function buttonTag() {

}\n`,
    verify: (code) =>
      verifyWithHarness(
        code,
        `;(function () {
  if (typeof buttonTag !== 'function') throw new Error('Потрібна функція buttonTag()');
  if (buttonTag() !== 'button') throw new Error('Очікується рядок "button"');
})();`,
      ),
  },
  {
    id: 'async-promise',
    topicSlug: 'async-intro',
    order: 1,
    title: 'Promise з текстом',
    description:
      'Асинхронна функція **giveOk()** повертає **Promise**, який успішно завершується рядком **`"ok"`** (можна через **async/await** або **new Promise**).',
    starterCode: `async function giveOk() {

}\n`,
    verify: async (code) => {
      try {
        const factory = new Function(`
          ${code}
          return giveOk;
        `);
        const fn = factory();
        if (typeof fn !== 'function') throw new Error('Потрібна функція giveOk');
        const p = fn();
        if (!(p instanceof Promise)) throw new Error('giveOk() має повертати Promise');
        const v = await p;
        if (v !== 'ok') throw new Error('Promise має резолвитись у рядок "ok", отримано: ' + JSON.stringify(v));
        return { ok: true };
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    },
  },
];
