# Supabase SQL (CodeUp)

У **Dashboard → SQL Editor** виконуйте скрипти **в цьому порядку**. Наступні кроки залежать від попередніх таблиць і функцій.

**Один файл:** [`all.sql`](all.sql) — усі кроки 1–8 послідовно (зручно для нового проєкту). Окремі `.sql` лишаються для точкових оновлень.

1. **`profiles.sql`** — таблиця `public.profiles`, RLS для власного рядка.
2. **`topics.sql`** — каталог тем і теорії (`public.topics`).
3. **`practice_tasks.sql`** — вправи практикуму; потребує рядки в `topics`.
4. **`admin.sql`** — класи, поля профілю (роль, блокування, заявка вчителя), адмін-політики та RPC; потребує `profiles`. Після першого застосування вручну призначте адміна: `update public.profiles set role = 'admin' where id = '<uuid з auth.users>';` (деталь у заголовку файлу).
5. **`practice_progress.sql`** — серверне збереження проходження вправ і RPC для вчителів; потребує `profiles`, `practice_tasks` і функції з `admin.sql` (зокрема `is_current_user_teacher`).
6. **`gamification.sql`** — змагання: бали й серія за календарними днями **Europe/Kyiv**, заморозки, RPC рейтингу класу; потребує `practice_task_passes` і розширений `profiles` з `admin.sql`.
7. **`class_topic_order.sql`** — порядок тем для класу (після `admin.sql` і `topics.sql`).
8. **`task_submissions.sql`** — анонімні приклади рішень учнів (після `practice_progress.sql`); додає `classes.peer_solutions_enabled`.

**Звіти навантаження (контент):** `scripts/report-topic-workload.sql` у SQL Editor; offline — `node scripts/report-topic-workload.mjs`. Див. `d/codeup-topic-workload-report.md`.

**Edge Function `chat-ai` (чат Gemini):** вихідний код у **`functions/chat-ai/index.ts`** (у цьому ж каталозі `supabase/`). Після змін задеплой функцію в Supabase (`supabase functions deploy chat-ai` або через Dashboard). У Secrets мають бути **`GEMINI_API_KEY`**, опційно **`GEMINI_MODEL`**.

Повторні запуски: скрипти здебільшого idempotent (`if not exists`, `drop … if exists` де потрібно). Якщо змінюється **сигнатура або тип результату** RPC, у відповідному файлі має бути `DROP FUNCTION …` перед новим `CREATE` — див. `admin.sql` для `admin_list_users_with_email`.
