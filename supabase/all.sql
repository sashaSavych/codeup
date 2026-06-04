-- =============================================================================
-- CodeUp — повна схема та seed (один файл)
-- =============================================================================
-- Виконати в Supabase Dashboard → SQL Editor (один раз на новий проєкт).
-- Порядок кроків узгоджений із supabase/README.md; не змінюйте порядок секцій.
--
-- Після кроку 4 (admin.sql) призначте першого адміна вручну:
--   update public.profiles set role = 'admin' where id = '<uuid з auth.users>';
--
-- Окремі файли залишаються джерелом правди; all.sql збирається з них.
-- Edge Function chat-ai — окремо (не SQL): supabase/functions/chat-ai/
-- =============================================================================


-- =============================================================================
-- STEP 1: profiles.sql
-- =============================================================================

-- Run in Supabase Dashboard → SQL Editor (once per project).
-- Script order: see supabase/README.md (this file is step 1).
-- Stores learner profile fields linked to auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  gender text,
  class_name text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================================================
-- STEP 2: topics.sql
-- =============================================================================

-- Run in Supabase Dashboard → SQL Editor.
-- Script order: see supabase/README.md (this file is step 2; after profiles.sql if you use profiles first).
-- Then run practice_tasks.sql (practice exercises; requires rows in topics).
-- Public catalogue: anyone (anon + authenticated) can read topics and theory.

create table if not exists public.topics (
  slug text primary key,
  sort_order int not null unique,
  title text not null,
  summary text not null default '',
  theory_md text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists topics_sort_order_idx on public.topics (sort_order);

alter table public.topics enable row level security;

drop policy if exists "topics_select_public" on public.topics;
create policy "topics_select_public"
  on public.topics
  for select
  to anon, authenticated
  using (true);

grant select on table public.topics to anon, authenticated;
grant select on table public.topics to service_role;

-- Seed (idempotent)
insert into public.topics (slug, sort_order, title, summary, theory_md) values
(
  'intro',
  1,
  'Вступ до JavaScript і робочого середовища',
  'Навіщо JavaScript у сучасному вебі; редактор, консоль браузера; мінімально — `const` і рядок, проста функція з `return`, перша програма в консолі.',
  $t$
## Навіщо це вчити

JavaScript — мова, якою описують поведінку сторінок у браузері: реакції на кліки, перевірки форм, анімації, роботу з даними. У межах модуля ти опануєш базовий синтаксис і зможеш читати та писати невеликі скрипти.

## Де писати код

Підійде будь-який редактор з підсвіткою синтаксису. У браузері відкрий **інструменти розробника** (F12) → вкладка **Console**: там можна виконувати окремі вирази й бачити результат або помилку.

## Константа й рядок у коді

Щоб зберегти значення під ім’ям, використовують **`const імʼя = значення;`**. Рядок задають у **лапках** (одинарних `'...'` або подвійних `"..."`):

```js
const moduleName = "CodeUp";
```

Далі в темі «Синтаксис, змінні та типи» розглянемо `let` і `const` детальніше — для першої практики достатньо цього прикладу.

## Найпростіша функція та `return`

Частину логіки зручно винести в **функцію**: після слова **`function`** дають ім’я, у **дужках** — параметри, у **фігурних дужках** — тіло. Результат назад «віддають» через **`return`**:

```js
function repeatTwice(text) {
  return text + text;
}
```

Виклик `repeatTwice("ha")` дає рядок `"haha"`. Рядок можна склеїти з кількох частин оператором `+` (наприклад, літерал + параметр). У практикумі цієї теми знадобиться коротка функція з `return` — без складних конструкцій.

## Перший крок

Спробуй у консолі:

```js
console.log("Привіт, CodeUp!");
```

Повідомлення в консолі — твій перший «діалог» із середовищом виконання. Далі важливо звикати **читати текст помилки**: він підказує рядок і причину.
$t$
),
(
  'syntax-basics',
  2,
  'Синтаксис, змінні та типи даних',
  'let і const, іменування, числа й рядки, перетворення типів; читання повідомлень про помилки в консолі.',
  $t$
## Змінні

- `let` — змінна, значення можна змінити.
- `const` — константа: посилання на значення не перепризначають (для об’єктів вміст може змінюватися — це окрема тема).

Імена краще давати **змістовні**: `userScore`, а не `x`.

## Типи

JavaScript має динамічні типи: у змінній можуть бути число, рядок, булеве тощо. Корисно розуміти різницю між `5` (число) і `"5"` (рядок) — при додаванні `+` поведінка відрізняється.

## Перетворення

Функції на кшталт `Number("12")` або `String(42)` допомагають явно привести тип. Уникай зайвих «магічних» приведень — краще явно показати намір у коді.
$t$
),
(
  'operators',
  3,
  'Оператори та вирази',
  'Арифметика, порівняння, логіка; пріоритет операцій; короткі форми присвоєння там, де це доречно.',
  $t$
## Арифметика

`+ - * / %` — стандартні операції. Ділення чисел може дати дробовий результат; для цілочисельної логіки потрібні додаткові прийоми.

## Порівняння

Для перевірок зазвичай використовують **сувору рівність** `===` і `!==`, щоб не допустити неочевидних перетворень типів, які дає `==`.

## Логіка

`&&` (і), `||` (або), `!` (заперечення). Коротке замикання (`a && b`) часто застосовують для умовного виконання — пізніше це стане в нагоді в DOM-подіях.

## Пріоритет

У складних виразах дужки `()` роблять намір явним; не покладайся лише на пам’ять про пріоритет операторів.
$t$
),
(
  'control-flow',
  4,
  'Умови та розгалуження',
  'if / else if / else, тернарний оператор; планування гілок логіки без «магічних» значень у всьому коді.',
  $t$
## if / else

Класичне розгалуження:

```js
if (score >= 60) {
  console.log("Зараховано");
} else {
  console.log("Потрібно підтягнути матеріал");
}
```

## Ланцюжок умов

`else if` дозволяє розглянути кілька взаємовиключних варіантів без глибокої вкладеності.

## Тернарний оператор

`умова ? варіантА : варіантБ` — зручний для коротких виразів; для складної логіки читабельніший звичайний `if`.

## Читабельність

Уникай глибокої «драбини» з if; інколи варто винести перевірки в окремі функції або ранній `return` (коли стиль проєкту це дозволяє).
$t$
),
(
  'loops',
  5,
  'Цикли',
  'for, while, do…while; перебір колекцій; типові помилки нескінченного циклу та зайва складність умов.',
  $t$
## for

Найпоширеніший цикл з лічильником:

```js
for (let i = 0; i < 3; i++) {
  console.log(i);
}
```

## while / do…while

`while` перевіряє умову **перед** ітерацією; `do…while` — **після** (мінімум один прохід).

## Перебір даних

Для масивів часто використовують `for...of` або методи на кшталт `forEach` (залежно від контексту і правил стилю в команді).

## Пастка нескінченного циклу

Переконайся, що умова виходу колись стане хибною. У консолі довгий цикл може «підвісити» вкладку — плануй кроки обережно.
$t$
),
(
  'functions',
  6,
  'Функції',
  'Оголошення й виклик, параметри та повернення значення; область видимості; короткі чисті функції для повторного використання.',
  $t$
## Навіщо функції

Функція групує кроки під одним ім’ям, приймає **параметри** і може **повертати** результат. Це зменшує дублювання й полегшує тестування.

## Оголошення

```js
function square(n) {
  return n * n;
}
```

Існують також **функціональні вирази** та **стрілкові** функції — вони важливі для стилю сучасного JS.

## Параметри за замовчуванням

Можна задавати значення, якщо аргумент не передали — це робить API функції зрозумілішим.

## Чисті функції

Там, де можливо, уникай прихованих змін зовнішнього стану всередині функції: так простіше міркувати про результат.
$t$
),
(
  'collections',
  7,
  'Масиви та об’єкти',
  'Створення, доступ за індексом і ключем; базові методи масивів; об’єкт як структура даних для предметної області.',
  $t$
## Масив

Упорядкований список значень:

```js
const primes = [2, 3, 5, 7];
primes[0]; // 2
```

Корисні методи: `push`, `pop`, `map`, `filter` (розглянемо детальніше на практиці).

## Об’єкт

Пари «ключ — значення» описують сутність:

```js
const learner = { name: "Оля", grade: 9 };
learner.name;
```

Об’єкти часто приходять з API — важливо безпечно звертатися до полів.

## Комбінація

Масив об’єктів — типовий формат таблиць, списків користувачів, результатів пошуку.
$t$
),
(
  'dom-events',
  8,
  'DOM і події',
  'Зв’язок сторінки зі скриптом; вибір елементів; обробники подій; прості інтерактивні сценарії без зайвого дублювання коду.',
  $t$
## DOM

**Document Object Model** — дерево елементів HTML, з яким можна працювати з JavaScript: змінювати текст, класи, атрибути.

## Вибір елементів

`document.querySelector` / `querySelectorAll` — сучасний спосіб знайти вузли за CSS-селектором.

## Події

Клік, введення тексту, надсилання форми — усе це **події**. На них підписуються обробниками:

```js
button.addEventListener("click", () => {
  console.log("Клац!");
});
```

## Розділення відповідальності

HTML — структура, CSS — вигляд, JS — поведінка. Не змішуй усе в один безладний скрипт без структури.
$t$
),
(
  'async-intro',
  9,
  'Основи асинхронності',
  'setTimeout, Promise та async/await на рівні ідей; чому порядок виконання важливий для мережевих запитів (підготовка до практикуму).',
  $t$
## Навіщо асинхронність

Браузер не повинен «зависати» на довгих операціях. Таймери, анімації, запити до сервера плануються так, щоб інтерфейс лишався відзивчивим.

## setTimeout

Відкладає виклик функції на пізніший момент — простий спосіб побачити відкладене виконання.

## Promise

Обіцянка результату, який з’явиться пізніше: **виконано** або **відхилено**. Ланцюжок `.then()` / `.catch()` описує послідовність кроків.

## async / await

Синтаксичний цукор над Promise: код читається як послідовний, хоча під капотом він асинхронний.

## Підготовка до практикуму

Далі ти зіткнешся з реальними запитами до API — важливо розуміти, **коли** саме виконується твій код після відповіді сервера.
$t$
)
on conflict (slug) do update set
  sort_order = excluded.sort_order,
  title = excluded.title,
  summary = excluded.summary,
  theory_md = excluded.theory_md,
  updated_at = now();

-- =============================================================================
-- STEP 3: practice_tasks.sql
-- =============================================================================

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


-- =============================================================================
-- STEP 4: admin.sql
-- =============================================================================

-- Admin: classes list, user roles, blocking. Run in Supabase SQL Editor.
-- Full script order: supabase/README.md (this file after profiles.sql; before practice_progress.sql).
-- First admin: update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
--
-- Order matters: profiles.role must exist before is_current_user_admin() is created.

-- ---------------------------------------------------------------------------
-- Classes table (policies that need admin — added after role column + helper)
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (name)
);

create index if not exists classes_sort_order_idx on public.classes (sort_order, name);

alter table public.classes enable row level security;

drop policy if exists "classes_select_authenticated" on public.classes;
create policy "classes_select_authenticated"
  on public.classes for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Profiles: role, block flag, link to class (before functions that reference role)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'teacher', 'admin'));

alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

alter table public.profiles
  add column if not exists class_id uuid references public.classes (id) on delete set null;

create index if not exists profiles_class_id_idx on public.profiles (class_id);
create index if not exists profiles_is_blocked_idx on public.profiles (is_blocked) where is_blocked;

alter table public.profiles
  add column if not exists teacher_role_requested boolean not null default false;

create index if not exists profiles_teacher_role_req_idx
  on public.profiles (teacher_role_requested)
  where teacher_role_requested;

-- ---------------------------------------------------------------------------
-- Helper: avoids RLS recursion when policies on profiles reference profiles
-- ---------------------------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.is_current_user_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'teacher' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_current_user_teacher() from public;
grant execute on function public.is_current_user_teacher() to authenticated;

-- ---------------------------------------------------------------------------
-- Classes: admin-only write policies (after is_current_user_admin exists)
-- ---------------------------------------------------------------------------
drop policy if exists "classes_insert_admin" on public.classes;
create policy "classes_insert_admin"
  on public.classes for insert
  to authenticated
  with check (public.is_current_user_admin());

drop policy if exists "classes_update_admin" on public.classes;
create policy "classes_update_admin"
  on public.classes for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "classes_delete_admin" on public.classes;
create policy "classes_delete_admin"
  on public.classes for delete
  to authenticated
  using (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- Trigger: non-admins cannot change own role / is_blocked
-- ---------------------------------------------------------------------------
create or replace function public.profiles_lock_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := coalesce(new.role, 'student');
    if new.role is distinct from 'student' then
      new.role := 'student';
    end if;
    new.is_blocked := false;
    -- teacher_role_requested may be set by the new user (e.g. signup / profile); admins set role later
    return new;
  end if;
  if tg_op = 'UPDATE' and new.id = auth.uid() then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    -- teacher_role_requested: user may toggle own request; admins bypass above
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_privileged_fields_trg on public.profiles;
create trigger profiles_lock_privileged_fields_trg
  before insert or update on public.profiles
  for each row
  execute procedure public.profiles_lock_privileged_fields();

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_current_user_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ---------------------------------------------------------------------------
-- RPC: list users with email (admin only; empty for others)
-- ---------------------------------------------------------------------------
-- Postgres does not allow CREATE OR REPLACE when OUT/return row shape changes; drop first.
drop function if exists public.admin_list_users_with_email();

create function public.admin_list_users_with_email()
returns table (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_blocked boolean,
  class_id uuid,
  class_list_name text,
  class_free_name text,
  teacher_role_requested boolean,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.role,
    p.is_blocked,
    p.class_id,
    c.name,
    p.class_name,
    p.teacher_role_requested,
    p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.classes c on c.id = p.class_id
  where public.is_current_user_admin();
$$;

revoke all on function public.admin_list_users_with_email() from public;
grant execute on function public.admin_list_users_with_email() to authenticated;

-- =============================================================================
-- STEP 5: practice_progress.sql
-- =============================================================================

-- Server-side practice completion (for teachers viewing pupil progress).
-- Full script order: supabase/README.md (run after profiles.sql, topics.sql, practice_tasks.sql, admin.sql; then gamification.sql).

create table if not exists public.practice_task_passes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null references public.practice_tasks (id) on delete cascade,
  passed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists practice_task_passes_user_idx on public.practice_task_passes (user_id);

alter table public.practice_task_passes enable row level security;

drop policy if exists "practice_task_passes_select_scope" on public.practice_task_passes;
create policy "practice_task_passes_select_scope"
  on public.practice_task_passes
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_current_user_teacher()
    or public.is_current_user_admin()
  );

drop policy if exists "practice_task_passes_insert_own" on public.practice_task_passes;
create policy "practice_task_passes_insert_own"
  on public.practice_task_passes
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "practice_task_passes_update_own" on public.practice_task_passes;
create policy "practice_task_passes_update_own"
  on public.practice_task_passes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.practice_task_passes to authenticated;

-- ---------------------------------------------------------------------------
-- Teachers / admins: summary list of pupils (learners) with practice counts
-- ---------------------------------------------------------------------------
create or replace function public.teacher_list_pupils_progress()
returns table (
  pupil_id uuid,
  email text,
  first_name text,
  last_name text,
  class_display_name text,
  completed bigint,
  total_tasks bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.first_name,
    p.last_name,
    coalesce(c.name, p.class_name, ''::text),
    (select count(*)::bigint from public.practice_task_passes x where x.user_id = p.id),
    (select count(*)::bigint from public.practice_tasks pt)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.classes c on c.id = p.class_id
  where
    (public.is_current_user_teacher() or public.is_current_user_admin())
    and p.role = 'student'
    and not p.is_blocked;
$$;

revoke all on function public.teacher_list_pupils_progress() from public;
grant execute on function public.teacher_list_pupils_progress() to authenticated;

-- =============================================================================
-- STEP 6: gamification.sql
-- =============================================================================

-- Gamification: daily points, streak, freezes, class leaderboard.
-- Run after: profiles.sql, admin.sql, practice_progress.sql (needs profiles, practice_task_passes).
-- Calendar "day" for streaks and daily caps: Europe/Kyiv local date.

-- ---------------------------------------------------------------------------
-- Columns on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists competition_opt_in boolean not null default false;

alter table public.profiles
  add column if not exists leaderboard_nickname text;

alter table public.profiles
  add column if not exists competition_score int not null default 0;

alter table public.profiles
  add column if not exists streak_days int not null default 0;

alter table public.profiles
  add column if not exists last_competition_activity_date date;

alter table public.profiles
  add column if not exists freeze_balance int not null default 0;

-- ---------------------------------------------------------------------------
-- Daily points audit (Kyiv calendar dates)
-- ---------------------------------------------------------------------------
create table if not exists public.gamification_daily_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_date date not null,
  points int not null default 0 check (points >= 0),
  primary key (user_id, activity_date)
);

create index if not exists gamification_daily_scores_user_idx
  on public.gamification_daily_scores (user_id);

alter table public.gamification_daily_scores enable row level security;

drop policy if exists "gamification_daily_scores_select_own" on public.gamification_daily_scores;
create policy "gamification_daily_scores_select_own"
  on public.gamification_daily_scores for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "gamification_daily_scores_no_client_write" on public.gamification_daily_scores;
create policy "gamification_daily_scores_no_client_write"
  on public.gamification_daily_scores for all
  to authenticated
  using (false)
  with check (false);

-- ---------------------------------------------------------------------------
-- Unique nickname per class among opted-in participants
-- ---------------------------------------------------------------------------
create unique index if not exists profiles_leaderboard_nickname_class_unique
  on public.profiles (class_id, lower(trim(leaderboard_nickname)))
  where
    competition_opt_in
    and class_id is not null
    and leaderboard_nickname is not null
    and length(trim(leaderboard_nickname)) > 0;

-- ---------------------------------------------------------------------------
-- Non-admins cannot change leaderboard_nickname once set (clear allowed when opting out)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_leaderboard_nickname_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_current_user_admin() then
    return new;
  end if;
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.leaderboard_nickname is null then
    return new;
  end if;
  if new.leaderboard_nickname is not distinct from old.leaderboard_nickname then
    return new;
  end if;
  if new.competition_opt_in is distinct from true and new.leaderboard_nickname is null then
    return new;
  end if;
  raise exception 'Псевдонім для змагання можна задати лише один раз. Зверніться до адміністратора, якщо потрібна зміна.';
end;
$$;

drop trigger if exists profiles_leaderboard_nickname_lock_trg on public.profiles;
create trigger profiles_leaderboard_nickname_lock_trg
  before update on public.profiles
  for each row
  execute procedure public.profiles_leaderboard_nickname_lock();

-- ---------------------------------------------------------------------------
-- Kyiv "today"
-- ---------------------------------------------------------------------------
create or replace function public.gamification_kyiv_today()
returns date
language sql
stable
as $$
  select (current_timestamp at time zone 'Europe/Kyiv')::date;
$$;

revoke all on function public.gamification_kyiv_today() from public;

-- ---------------------------------------------------------------------------
-- Missed calendar days between last activity date and yesterday (Kyiv).
-- ---------------------------------------------------------------------------
create or replace function public.gamification_apply_idle_gaps(
  p_last date,
  p_score int,
  p_streak int,
  p_freeze int,
  out o_score int,
  out o_streak int,
  out o_freeze int,
  out o_had_reset boolean
)
language plpgsql
as $$
declare
  today date := public.gamification_kyiv_today();
  num_missed int;
  j int;
begin
  o_score := p_score;
  o_streak := p_streak;
  o_freeze := p_freeze;
  o_had_reset := false;
  if p_last is null then
    return;
  end if;
  if p_last >= today then
    return;
  end if;
  num_missed := (today - p_last)::int - 1;
  if num_missed < 1 then
    return;
  end if;
  for j in 1..num_missed loop
    if o_freeze > 0 then
      o_freeze := o_freeze - 1;
    else
      o_score := 0;
      o_streak := 0;
      o_had_reset := true;
      exit;
    end if;
  end loop;
end;
$$;

revoke all on function public.gamification_apply_idle_gaps(date, int, int, int) from public;

-- ---------------------------------------------------------------------------
-- Trigger: new practice_task_passes row (+1 point / day cap 50 Kyiv)
-- ---------------------------------------------------------------------------
create or replace function public.gamification_on_practice_task_pass()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.gamification_kyiv_today();
  last_before date;
  score int;
  streak int;
  freeze_bal int;
  opt_in boolean;
  blocked boolean;
  r text;
  had_reset boolean;
  gap_score int;
  gap_streak int;
  gap_freeze int;
  today_pts int;
  old_streak int;
  new_streak int;
  add_point boolean := true;
begin
  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in,
    p.is_blocked,
    p.role::text
  into score, streak, freeze_bal, last_before, opt_in, blocked, r
  from public.profiles p
  where p.id = new.user_id
  for update;

  if not found then
    return new;
  end if;

  if blocked or r is distinct from 'student' or not opt_in then
    return new;
  end if;

  select d.points
  into today_pts
  from public.gamification_daily_scores d
  where d.user_id = new.user_id and d.activity_date = today;

  today_pts := coalesce(today_pts, 0);

  if today_pts >= 50 then
    add_point := false;
  end if;

  select
    g.o_score,
    g.o_streak,
    g.o_freeze,
    g.o_had_reset
  into gap_score, gap_streak, gap_freeze, had_reset
  from public.gamification_apply_idle_gaps(last_before, score, streak, freeze_bal) g;

  old_streak := gap_streak;

  if add_point then
    insert into public.gamification_daily_scores (user_id, activity_date, points)
    values (new.user_id, today, 1)
    on conflict (user_id, activity_date) do update
      set points = public.gamification_daily_scores.points + excluded.points;

    gap_score := gap_score + 1;
  end if;

  if not add_point then
    update public.profiles
    set
      competition_score = gap_score,
      streak_days = gap_streak,
      freeze_balance = gap_freeze
    where id = new.user_id;
    return new;
  end if;

  -- Streak (only when a competition point was earned this insert)
  if last_before is null then
    new_streak := 1;
  elsif last_before = today then
    new_streak := old_streak;
  elsif last_before = today - 1 then
    new_streak := old_streak + 1;
  elsif had_reset then
    new_streak := 1;
  else
    -- missed one or more days; all covered by freezes
    new_streak := old_streak + 1;
  end if;

  if new_streak > old_streak and new_streak > 0 and new_streak % 7 = 0 and gap_freeze < 3 then
    gap_freeze := gap_freeze + 1;
  end if;

  update public.profiles
  set
    competition_score = gap_score,
    streak_days = new_streak,
    freeze_balance = gap_freeze,
    last_competition_activity_date = today
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists gamification_practice_pass_trg on public.practice_task_passes;
create trigger gamification_practice_pass_trg
  after insert on public.practice_task_passes
  for each row
  execute procedure public.gamification_on_practice_task_pass();

-- ---------------------------------------------------------------------------
-- Reconcile idle gaps without awarding a new point (e.g. on login / profile)
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_reconcile();

create or replace function public.gamification_reconcile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  last_before date;
  score int;
  streak int;
  freeze_bal int;
  opt_in boolean;
  blocked boolean;
  r text;
  had_reset boolean;
  gap_score int;
  gap_streak int;
  gap_freeze int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in,
    p.is_blocked,
    p.role::text
  into score, streak, freeze_bal, last_before, opt_in, blocked, r
  from public.profiles p
  where p.id = uid
  for update;

  if not found then
    return;
  end if;

  if blocked or r is distinct from 'student' or not opt_in then
    return;
  end if;

  select
    g.o_score,
    g.o_streak,
    g.o_freeze,
    g.o_had_reset
  into gap_score, gap_streak, gap_freeze, had_reset
  from public.gamification_apply_idle_gaps(last_before, score, streak, freeze_bal) g;

  update public.profiles
  set
    competition_score = gap_score,
    streak_days = gap_streak,
    freeze_balance = gap_freeze
  where id = uid;
end;
$$;

revoke all on function public.gamification_reconcile() from public;
grant execute on function public.gamification_reconcile() to authenticated;

-- ---------------------------------------------------------------------------
-- Leaderboard: same class as caller, opted-in students only
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_leaderboard(integer);

create or replace function public.gamification_leaderboard(p_limit integer default 100)
returns table (
  rank bigint,
  nickname text,
  competition_score int,
  streak_days int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  lim int := coalesce(nullif(p_limit, 0), 100);
  my_class uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if lim < 1 then
    lim := 1;
  end if;
  if lim > 100 then
    lim := 100;
  end if;

  select p.class_id into my_class
  from public.profiles p
  where p.id = uid;

  if my_class is null then
    return;
  end if;

  return query
  select
    row_number() over (order by p.competition_score desc, p.leaderboard_nickname asc)::bigint,
    trim(p.leaderboard_nickname)::text,
    p.competition_score,
    p.streak_days
  from public.profiles p
  where
    p.class_id = my_class
    and p.competition_opt_in
    and p.role = 'student'
    and not p.is_blocked
    and p.leaderboard_nickname is not null
    and length(trim(p.leaderboard_nickname)) > 0
  order by p.competition_score desc, p.leaderboard_nickname asc
  limit lim;
end;
$$;

revoke all on function public.gamification_leaderboard(integer) from public;
grant execute on function public.gamification_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Own stats (after reconcile — caller should invoke reconcile first if needed)
-- ---------------------------------------------------------------------------
drop function if exists public.gamification_status();

create or replace function public.gamification_status()
returns table (
  competition_score int,
  streak_days int,
  freeze_balance int,
  last_competition_activity_date date,
  competition_opt_in boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.competition_score,
    p.streak_days,
    p.freeze_balance,
    p.last_competition_activity_date,
    p.competition_opt_in
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.gamification_status() from public;
grant execute on function public.gamification_status() to authenticated;

-- =============================================================================
-- STEP 7: class_topic_order.sql
-- =============================================================================

-- Per-class topic order overrides. Run after admin.sql (needs classes + topics).
-- Script order: see supabase/README.md

create table if not exists public.class_topic_order (
  class_id uuid not null references public.classes (id) on delete cascade,
  topic_slug text not null references public.topics (slug) on delete cascade,
  sort_order int not null,
  primary key (class_id, topic_slug),
  unique (class_id, sort_order)
);

create index if not exists class_topic_order_class_idx on public.class_topic_order (class_id, sort_order);

alter table public.class_topic_order enable row level security;

drop policy if exists "class_topic_order_select_authenticated" on public.class_topic_order;
create policy "class_topic_order_select_authenticated"
  on public.class_topic_order
  for select
  to authenticated
  using (true);

drop policy if exists "class_topic_order_write_teacher_admin" on public.class_topic_order;
create policy "class_topic_order_write_teacher_admin"
  on public.class_topic_order
  for all
  to authenticated
  using (public.is_current_user_admin() or public.is_current_user_teacher())
  with check (public.is_current_user_admin() or public.is_current_user_teacher());

grant select, insert, update, delete on table public.class_topic_order to authenticated;

-- Bulk replace order for one class (delete missing slugs from override set).
create or replace function public.upsert_class_topic_order(p_class_id uuid, p_slugs text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_current_user_admin() or public.is_current_user_teacher()) then
    raise exception 'not allowed';
  end if;
  if p_class_id is null then
    raise exception 'class_id required';
  end if;

  delete from public.class_topic_order where class_id = p_class_id;

  if p_slugs is null or array_length(p_slugs, 1) is null then
    return;
  end if;

  insert into public.class_topic_order (class_id, topic_slug, sort_order)
  select p_class_id, s.slug, s.ord::int
  from unnest(p_slugs) with ordinality as s(slug, ord);
end;
$$;

revoke all on function public.upsert_class_topic_order(uuid, text[]) from public;
grant execute on function public.upsert_class_topic_order(uuid, text[]) to authenticated;

-- =============================================================================
-- STEP 8: task_submissions.sql
-- =============================================================================

-- Peer solution sharing (opt-in snapshots). Run after practice_progress.sql + admin.sql.
-- Script order: see supabase/README.md

alter table public.classes
  add column if not exists peer_solutions_enabled boolean not null default false;

create table if not exists public.task_submissions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null references public.practice_tasks (id) on delete cascade,
  code_snapshot text not null,
  share_opt_in boolean not null default false,
  submitted_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists task_submissions_task_share_idx
  on public.task_submissions (task_id)
  where share_opt_in = true;

alter table public.task_submissions enable row level security;

-- Learners manage only their rows; no peer SELECT on table (use RPC).
drop policy if exists "task_submissions_select_own" on public.task_submissions;
create policy "task_submissions_select_own"
  on public.task_submissions
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_current_user_admin() or public.is_current_user_teacher());

drop policy if exists "task_submissions_insert_own" on public.task_submissions;
create policy "task_submissions_insert_own"
  on public.task_submissions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "task_submissions_update_own" on public.task_submissions;
create policy "task_submissions_update_own"
  on public.task_submissions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.task_submissions to authenticated;

-- Anonymous peer gallery: ≥3 opt-in from same class with peer_solutions_enabled.
create or replace function public.list_peer_solutions(p_task_id text)
returns table (code_snapshot text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_enabled boolean;
  v_count int;
begin
  select p.class_id into v_class_id
  from public.profiles p
  where p.id = auth.uid();

  if v_class_id is null then
    return;
  end if;

  select c.peer_solutions_enabled into v_enabled
  from public.classes c
  where c.id = v_class_id;

  if not coalesce(v_enabled, false) then
    return;
  end if;

  select count(*)::int into v_count
  from public.task_submissions ts
  join public.profiles p on p.id = ts.user_id
  where ts.task_id = p_task_id
    and ts.share_opt_in = true
    and p.class_id = v_class_id;

  if v_count < 3 then
    return;
  end if;

  return query
  select ts.code_snapshot
  from public.task_submissions ts
  join public.profiles p on p.id = ts.user_id
  where ts.task_id = p_task_id
    and ts.share_opt_in = true
    and p.class_id = v_class_id
  order by ts.submitted_at desc
  limit 20;
end;
$$;

revoke all on function public.list_peer_solutions(text) from public;
grant execute on function public.list_peer_solutions(text) to authenticated;

-- Count for UI threshold messaging (same rules, no snapshots until ≥3).
create or replace function public.peer_solutions_count(p_task_id text)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_enabled boolean;
begin
  select p.class_id into v_class_id
  from public.profiles p
  where p.id = auth.uid();

  if v_class_id is null then
    return 0;
  end if;

  select c.peer_solutions_enabled into v_enabled
  from public.classes c
  where c.id = v_class_id;

  if not coalesce(v_enabled, false) then
    return 0;
  end if;

  return (
    select count(*)::int
    from public.task_submissions ts
    join public.profiles p on p.id = ts.user_id
    where ts.task_id = p_task_id
      and ts.share_opt_in = true
      and p.class_id = v_class_id
  );
end;
$$;

revoke all on function public.peer_solutions_count(text) from public;
grant execute on function public.peer_solutions_count(text) to authenticated;

-- =============================================================================
-- END OF all.sql
-- =============================================================================
