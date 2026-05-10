#!/usr/bin/env node
/**
 * Generates supabase/practice_tasks.sql (DDL + seed).
 * Run: node scripts/gen-practice-tasks-sql.mjs > supabase/practice_tasks.sql
 */
function dollar(tagBase, content) {
  let tag = tagBase.replace(/[^a-zA-Z0-9_]/g, '_');
  while (content.includes(`$${tag}$`)) {
    tag += 'x';
  }
  return `$${tag}$${content}$${tag}$`;
}

const tasks = [
  {
    id: 'intro-hello',
    topic_slug: 'intro',
    sort_order: 1,
    title: 'Перший рядок',
    description:
      'Оголоси **константу** `hello` з рядком `"CodeUp"` (лапки як у прикладі). Нічого не виводь у консоль — перевірка читає значення змінної.',
    starter_code: '// const hello = ...\n',
    harness: `;(function () {
  if (typeof hello === 'undefined') throw new Error('Потрібна константа hello');
  if (hello !== 'CodeUp') throw new Error('hello має бути рядком "CodeUp", зараз: ' + JSON.stringify(hello));
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'intro-greet',
    topic_slug: 'intro',
    sort_order: 2,
    title: 'Функція привітання',
    description:
      'Напиши функцію **greet(name)**, яка повертає рядок виду `Привіт, Імʼя!` (з пробілом після коми).',
    starter_code: `function greet(name) {
  // поверни рядок
}
`,
    harness: `;(function () {
  if (typeof greet !== 'function') throw new Error('Потрібна функція greet(name)');
  if (greet('Оля') !== 'Привіт, Оля!') throw new Error('Перевір вітання для імені "Оля"');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'syntax-number',
    topic_slug: 'syntax-basics',
    sort_order: 1,
    title: 'Рядок у число',
    description:
      'Оголоси **const n**, присвої йому результат перетворення рядка `"42"` у число (використай **Number(...)**).',
    starter_code: '// const n = ...\n',
    harness: `;(function () {
  if (typeof n === 'undefined') throw new Error('Потрібна константа n');
  if (n !== 42 || typeof n !== 'number') throw new Error('n має бути числом 42');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'syntax-let',
    topic_slug: 'syntax-basics',
    sort_order: 2,
    title: 'Зміна значення',
    description: 'Оголоси **let score = 10**, потім збільш score на **5** другим рядком.',
    starter_code: `let score = 10;
// score = ...
`,
    harness: `;(function () {
  if (typeof score === 'undefined') throw new Error('Потрібна змінна score');
  if (score !== 15) throw new Error('score має дорівнювати 15, зараз: ' + score);
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'operators-max',
    topic_slug: 'operators',
    sort_order: 1,
    title: 'Більше з двох',
    description: 'Функція **max(a, b)** повертає більше з двох чисел (використай порівняння або Math.max).',
    starter_code: `function max(a, b) {

}
`,
    harness: `;(function () {
  if (typeof max !== 'function') throw new Error('Потрібна функція max(a, b)');
  if (max(3, 7) !== 7) throw new Error('max(3, 7) має бути 7');
  if (max(-1, -5) !== -1) throw new Error('max(-1, -5) має бути -1');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'operators-even',
    topic_slug: 'operators',
    sort_order: 2,
    title: 'Парність',
    description: 'Функція **isEven(n)** повертає **true**, якщо число парне, інакше **false**.',
    starter_code: `function isEven(n) {

}
`,
    harness: `;(function () {
  if (typeof isEven !== 'function') throw new Error('Потрібна функція isEven(n)');
  if (isEven(4) !== true || isEven(3) !== false) throw new Error('Перевір парність для 4 та 3');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'control-grade',
    topic_slug: 'control-flow',
    sort_order: 1,
    title: 'Зараховано чи ні',
    description:
      'Функція **passing(score)** повертає рядок **`"зараховано"`**, якщо score **>= 60**, інакше **`"незараховано"`**.',
    starter_code: `function passing(score) {

}
`,
    harness: `;(function () {
  if (typeof passing !== 'function') throw new Error('Потрібна функція passing(score)');
  if (passing(70) !== 'зараховано') throw new Error('score 70 має бути зараховано');
  if (passing(59) !== 'незараховано') throw new Error('score 59 має бути незараховано');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'loops-sum',
    topic_slug: 'loops',
    sort_order: 1,
    title: 'Сума масиву',
    description:
      'Функція **sumNumbers(nums)** приймає масив чисел і повертає їх суму (цикл **for** або інший на твій вибір).',
    starter_code: `function sumNumbers(nums) {

}
`,
    harness: `;(function () {
  if (typeof sumNumbers !== 'function') throw new Error('Потрібна функція sumNumbers(nums)');
  if (sumNumbers([1, 2, 3]) !== 6) throw new Error('Сума [1,2,3] має бути 6');
  if (sumNumbers([]) !== 0) throw new Error('Сума порожнього масиву має бути 0');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'functions-double',
    topic_slug: 'functions',
    sort_order: 1,
    title: 'Подвоєння',
    description: 'Стрілкова функція **double** приймає **x** і повертає **x * 2**.',
    starter_code: `const double = (x) => {

};
`,
    harness: `;(function () {
  if (typeof double !== 'function') throw new Error('Потрібна стрілкова функція double');
  if (double(5) !== 10) throw new Error('double(5) має бути 10');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'collections-first',
    topic_slug: 'collections',
    sort_order: 1,
    title: 'Перший елемент',
    description:
      'Функція **first(arr)** повертає перший елемент масиву або **undefined**, якщо масив порожній.',
    starter_code: `function first(arr) {

}
`,
    harness: `;(function () {
  if (typeof first !== 'function') throw new Error('Потрібна функція first(arr)');
  if (first([9, 2]) !== 9) throw new Error('Перший елемент [9,2] має бути 9');
  if (first([]) !== undefined) throw new Error('Для [] очікується undefined');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'collections-person',
    topic_slug: 'collections',
    sort_order: 2,
    title: 'Поле об’єкта',
    description:
      'Створи об’єкт **person** з полями **name** (рядок) та **grade** (число). Значення на твій смак, але **grade** має бути **11** для перевірки.',
    starter_code: `const person = {

};
`,
    harness: `;(function () {
  if (typeof person === 'undefined') throw new Error("Потрібен об'єкт person");
  if (person.grade !== 11) throw new Error('person.grade має бути числом 11 для автоперевірки');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'dom-tag',
    topic_slug: 'dom-events',
    sort_order: 1,
    title: 'Тег кнопки',
    description:
      'Функція **buttonTag()** повертає рядок **`"button"`** — як назва HTML-тега для кнопки (маленькими літерами).',
    starter_code: `function buttonTag() {

}
`,
    harness: `;(function () {
  if (typeof buttonTag !== 'function') throw new Error('Потрібна функція buttonTag()');
  if (buttonTag() !== 'button') throw new Error('Очікується рядок "button"');
})();`,
    verify_kind: 'harness',
  },
  {
    id: 'async-promise',
    topic_slug: 'async-intro',
    sort_order: 1,
    title: 'Promise з текстом',
    description:
      'Асинхронна функція **giveOk()** повертає **Promise**, який успішно завершується рядком **`"ok"`** (можна через **async/await** або **new Promise**).',
    starter_code: `async function giveOk() {

}
`,
    harness: '',
    verify_kind: 'async_give_ok',
  },
];

const ddl = `-- Catalogue of coding exercises (practice tab). Run after topics.sql.
-- Regenerate seed body: node scripts/gen-practice-tasks-sql.mjs > supabase/practice_tasks.sql

create table if not exists public.practice_tasks (
  id text primary key,
  topic_slug text not null references public.topics (slug) on delete cascade,
  sort_order int not null,
  title text not null,
  description text not null,
  starter_code text not null,
  harness text not null default '',
  verify_kind text not null default 'harness'
    check (verify_kind in ('harness', 'async_give_ok')),
  unique (topic_slug, sort_order)
);

create index if not exists practice_tasks_topic_slug_idx on public.practice_tasks (topic_slug);

alter table public.practice_tasks enable row level security;

drop policy if exists "practice_tasks_select_public" on public.practice_tasks;
create policy "practice_tasks_select_public"
  on public.practice_tasks
  for select
  to anon, authenticated
  using (true);

grant select on table public.practice_tasks to anon, authenticated;
grant select on table public.practice_tasks to service_role;

`;

console.log(ddl);

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  const tag = `pt_${t.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const desc = dollar(`${tag}_desc`, t.description);
  const starter = dollar(`${tag}_starter`, t.starter_code);
  const harnessSql = t.harness === '' ? "''" : dollar(`${tag}_harness`, t.harness);
  const title = dollar(`${tag}_title`, t.title);
  console.log(`insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  ${dollar(`${tag}_id`, t.id)},
  ${dollar(`${tag}_slug`, t.topic_slug)},
  ${t.sort_order},
  ${title},
  ${desc},
  ${starter},
  ${harnessSql},
  ${dollar(`${tag}_vk`, t.verify_kind)}
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;
`);
}
