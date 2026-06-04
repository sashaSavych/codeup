-- Catalogue of coding exercises (practice tab). Run after topics.sql.
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


insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_intro_hello_id$intro-hello$pt_intro_hello_id$,
  $pt_intro_hello_slug$intro$pt_intro_hello_slug$,
  1,
  $pt_intro_hello_title$Перший рядок$pt_intro_hello_title$,
  $pt_intro_hello_desc$Оголоси **константу** `hello` з рядком `"CodeUp"` (лапки як у прикладі). У теорії цієї теми — розділ «Константа й рядок». Нічого не виводь у консоль — перевірка читає значення змінної.

## Критерії успіху
- Є константа `hello`
- Значення — рядок `"CodeUp"`$pt_intro_hello_desc$,
  $pt_intro_hello_starter$// const hello = ...
$pt_intro_hello_starter$,
  $pt_intro_hello_harness$;(function () {
  if (typeof hello === 'undefined') throw new Error('Потрібна константа hello');
  if (hello !== 'CodeUp') throw new Error('hello має бути рядком "CodeUp", зараз: ' + JSON.stringify(hello));
})();$pt_intro_hello_harness$,
  $pt_intro_hello_vk$harness$pt_intro_hello_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_intro_greet_id$intro-greet$pt_intro_greet_id$,
  $pt_intro_greet_slug$intro$pt_intro_greet_slug$,
  2,
  $pt_intro_greet_title$Функція привітання$pt_intro_greet_title$,
  $pt_intro_greet_desc$Напиши функцію **greet(name)**, яка **повертає** (`return`) рядок виду `Привіт, Імʼя!` (з пробілом після коми). Можна склеїти частини через `+`. У теорії — розділ «Найпростіша функція та `return`».

## Критерії успіху
- Є функція `greet` з одним параметром
- `greet("Оля")` повертає рядок `Привіт, Оля!`$pt_intro_greet_desc$,
  $pt_intro_greet_starter$function greet(name) {
  // поверни рядок
}
$pt_intro_greet_starter$,
  $pt_intro_greet_harness$;(function () {
  if (typeof greet !== 'function') throw new Error('Потрібна функція greet(name)');
  if (greet('Оля') !== 'Привіт, Оля!') throw new Error('Перевір вітання для імені "Оля"');
})();$pt_intro_greet_harness$,
  $pt_intro_greet_vk$harness$pt_intro_greet_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_syntax_number_id$syntax-number$pt_syntax_number_id$,
  $pt_syntax_number_slug$syntax-basics$pt_syntax_number_slug$,
  1,
  $pt_syntax_number_title$Рядок у число$pt_syntax_number_title$,
  $pt_syntax_number_desc$Оголоси **const n**, присвої йому результат перетворення рядка `"42"` у число (використай **Number(...)**).

## Критерії успіху
- Є константа `n`
- Тип `n` — число (не рядок)
- Значення `n` дорівнює 42$pt_syntax_number_desc$,
  $pt_syntax_number_starter$// const n = ...
$pt_syntax_number_starter$,
  $pt_syntax_number_harness$;(function () {
  if (typeof n === 'undefined') throw new Error('Потрібна константа n');
  if (n !== 42 || typeof n !== 'number') throw new Error('n має бути числом 42');
})();$pt_syntax_number_harness$,
  $pt_syntax_number_vk$harness$pt_syntax_number_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_syntax_let_id$syntax-let$pt_syntax_let_id$,
  $pt_syntax_let_slug$syntax-basics$pt_syntax_let_slug$,
  2,
  $pt_syntax_let_title$Зміна значення$pt_syntax_let_title$,
  $pt_syntax_let_desc$Оголоси **let score = 10**, потім збільш score на **5** другим рядком.$pt_syntax_let_desc$,
  $pt_syntax_let_starter$let score = 10;
// score = ...
$pt_syntax_let_starter$,
  $pt_syntax_let_harness$;(function () {
  if (typeof score === 'undefined') throw new Error('Потрібна змінна score');
  if (score !== 15) throw new Error('score має дорівнювати 15, зараз: ' + score);
})();$pt_syntax_let_harness$,
  $pt_syntax_let_vk$harness$pt_syntax_let_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_operators_max_id$operators-max$pt_operators_max_id$,
  $pt_operators_max_slug$operators$pt_operators_max_slug$,
  1,
  $pt_operators_max_title$Більше з двох$pt_operators_max_title$,
  $pt_operators_max_desc$Функція **max(a, b)** повертає більше з двох чисел (використай порівняння або Math.max).$pt_operators_max_desc$,
  $pt_operators_max_starter$function max(a, b) {

}
$pt_operators_max_starter$,
  $pt_operators_max_harness$;(function () {
  if (typeof max !== 'function') throw new Error('Потрібна функція max(a, b)');
  if (max(3, 7) !== 7) throw new Error('max(3, 7) має бути 7');
  if (max(-1, -5) !== -1) throw new Error('max(-1, -5) має бути -1');
})();$pt_operators_max_harness$,
  $pt_operators_max_vk$harness$pt_operators_max_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_operators_even_id$operators-even$pt_operators_even_id$,
  $pt_operators_even_slug$operators$pt_operators_even_slug$,
  2,
  $pt_operators_even_title$Парність$pt_operators_even_title$,
  $pt_operators_even_desc$Функція **isEven(n)** повертає **true**, якщо число парне, інакше **false**.$pt_operators_even_desc$,
  $pt_operators_even_starter$function isEven(n) {

}
$pt_operators_even_starter$,
  $pt_operators_even_harness$;(function () {
  if (typeof isEven !== 'function') throw new Error('Потрібна функція isEven(n)');
  if (isEven(4) !== true || isEven(3) !== false) throw new Error('Перевір парність для 4 та 3');
})();$pt_operators_even_harness$,
  $pt_operators_even_vk$harness$pt_operators_even_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_control_grade_id$control-grade$pt_control_grade_id$,
  $pt_control_grade_slug$control-flow$pt_control_grade_slug$,
  1,
  $pt_control_grade_title$Зараховано чи ні$pt_control_grade_title$,
  $pt_control_grade_desc$Функція **passing(score)** повертає рядок **`"зараховано"`**, якщо score **>= 60**, інакше **`"незараховано"`**.$pt_control_grade_desc$,
  $pt_control_grade_starter$function passing(score) {

}
$pt_control_grade_starter$,
  $pt_control_grade_harness$;(function () {
  if (typeof passing !== 'function') throw new Error('Потрібна функція passing(score)');
  if (passing(70) !== 'зараховано') throw new Error('score 70 має бути зараховано');
  if (passing(59) !== 'незараховано') throw new Error('score 59 має бути незараховано');
})();$pt_control_grade_harness$,
  $pt_control_grade_vk$harness$pt_control_grade_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_loops_sum_id$loops-sum$pt_loops_sum_id$,
  $pt_loops_sum_slug$loops$pt_loops_sum_slug$,
  1,
  $pt_loops_sum_title$Сума масиву$pt_loops_sum_title$,
  $pt_loops_sum_desc$Функція **sumNumbers(nums)** приймає масив чисел і повертає їх суму (цикл **for** або інший на твій вибір).$pt_loops_sum_desc$,
  $pt_loops_sum_starter$function sumNumbers(nums) {

}
$pt_loops_sum_starter$,
  $pt_loops_sum_harness$;(function () {
  if (typeof sumNumbers !== 'function') throw new Error('Потрібна функція sumNumbers(nums)');
  if (sumNumbers([1, 2, 3]) !== 6) throw new Error('Сума [1,2,3] має бути 6');
  if (sumNumbers([]) !== 0) throw new Error('Сума порожнього масиву має бути 0');
})();$pt_loops_sum_harness$,
  $pt_loops_sum_vk$harness$pt_loops_sum_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_functions_double_id$functions-double$pt_functions_double_id$,
  $pt_functions_double_slug$functions$pt_functions_double_slug$,
  1,
  $pt_functions_double_title$Подвоєння$pt_functions_double_title$,
  $pt_functions_double_desc$Стрілкова функція **double** приймає **x** і повертає **x * 2**.$pt_functions_double_desc$,
  $pt_functions_double_starter$const double = (x) => {

};
$pt_functions_double_starter$,
  $pt_functions_double_harness$;(function () {
  if (typeof double !== 'function') throw new Error('Потрібна стрілкова функція double');
  if (double(5) !== 10) throw new Error('double(5) має бути 10');
})();$pt_functions_double_harness$,
  $pt_functions_double_vk$harness$pt_functions_double_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_collections_first_id$collections-first$pt_collections_first_id$,
  $pt_collections_first_slug$collections$pt_collections_first_slug$,
  1,
  $pt_collections_first_title$Перший елемент$pt_collections_first_title$,
  $pt_collections_first_desc$Функція **first(arr)** повертає перший елемент масиву або **undefined**, якщо масив порожній.$pt_collections_first_desc$,
  $pt_collections_first_starter$function first(arr) {

}
$pt_collections_first_starter$,
  $pt_collections_first_harness$;(function () {
  if (typeof first !== 'function') throw new Error('Потрібна функція first(arr)');
  if (first([9, 2]) !== 9) throw new Error('Перший елемент [9,2] має бути 9');
  if (first([]) !== undefined) throw new Error('Для [] очікується undefined');
})();$pt_collections_first_harness$,
  $pt_collections_first_vk$harness$pt_collections_first_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_collections_person_id$collections-person$pt_collections_person_id$,
  $pt_collections_person_slug$collections$pt_collections_person_slug$,
  2,
  $pt_collections_person_title$Поле об’єкта$pt_collections_person_title$,
  $pt_collections_person_desc$Створи об’єкт **person** з полями **name** (рядок) та **grade** (число). Значення на твій смак, але **grade** має бути **11** для перевірки.$pt_collections_person_desc$,
  $pt_collections_person_starter$const person = {

};
$pt_collections_person_starter$,
  $pt_collections_person_harness$;(function () {
  if (typeof person === 'undefined') throw new Error("Потрібен об'єкт person");
  if (person.grade !== 11) throw new Error('person.grade має бути числом 11 для автоперевірки');
})();$pt_collections_person_harness$,
  $pt_collections_person_vk$harness$pt_collections_person_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_dom_tag_id$dom-tag$pt_dom_tag_id$,
  $pt_dom_tag_slug$dom-events$pt_dom_tag_slug$,
  1,
  $pt_dom_tag_title$Тег кнопки$pt_dom_tag_title$,
  $pt_dom_tag_desc$Функція **buttonTag()** повертає рядок **`"button"`** — як назва HTML-тега для кнопки (маленькими літерами).$pt_dom_tag_desc$,
  $pt_dom_tag_starter$function buttonTag() {

}
$pt_dom_tag_starter$,
  $pt_dom_tag_harness$;(function () {
  if (typeof buttonTag !== 'function') throw new Error('Потрібна функція buttonTag()');
  if (buttonTag() !== 'button') throw new Error('Очікується рядок "button"');
})();$pt_dom_tag_harness$,
  $pt_dom_tag_vk$harness$pt_dom_tag_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

insert into public.practice_tasks (
  id, topic_slug, sort_order, title, description, starter_code, harness, verify_kind
) values (
  $pt_async_promise_id$async-promise$pt_async_promise_id$,
  $pt_async_promise_slug$async-intro$pt_async_promise_slug$,
  1,
  $pt_async_promise_title$Promise з текстом$pt_async_promise_title$,
  $pt_async_promise_desc$Асинхронна функція **giveOk()** повертає **Promise**, який успішно завершується рядком **`"ok"`** (можна через **async/await** або **new Promise**).$pt_async_promise_desc$,
  $pt_async_promise_starter$async function giveOk() {

}
$pt_async_promise_starter$,
  '',
  $pt_async_promise_vk$async_give_ok$pt_async_promise_vk$
)
on conflict (id) do update set
  topic_slug = excluded.topic_slug,
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  starter_code = excluded.starter_code,
  harness = excluded.harness,
  verify_kind = excluded.verify_kind;

