# AI agent instructions (CodeUp)

This file defines context and constraints for assistants working on the **CodeUp** educational web app. Product and stack details: [`README.md`](./README.md) (Ukrainian). Thesis source materials: [`../app/app.txt`](../app/app.txt) and [`../app/stack.txt`](../app/stack.txt).

---

## 1. Project goal

Web app for teaching JavaScript in secondary schools: modular navigation, theory → tasks → practice, student/teacher roles, gamification, and a support chat that must **not output full solutions**. User-facing UI copy is **Ukrainian** (see templates).

---

## 2. First steps

1. Read the relevant section of [`README.md`](./README.md) (architecture, screens, phases).
2. Align business logic or UX changes with the canon in `../app/app.txt`.
3. For new dependencies, verify licenses (open source, thesis transparency).

---

## 3. Pedagogy and ethics

- **AI chat:** do not implement or suggest prompts that output the **full ready-made solution** for a class/home exercise. Hints, error explanations, theory reminders, limited topic/exercise context only—as in `app.txt`.
- **Fairness:** no feature where the teacher solves for the student via AI acting as the student.
- **Didactics:** gamification must not replace content; points/streak rules stay transparent.
- **Content examples:** do not encourage unsafe script copies or sensitive data in learning examples (aligned with the thesis).

---

## 4. Security and engineering

- Student code runs in an **isolated** environment (e.g. `iframe` + **sandbox**) with **CSP**; do not weaken isolation for convenience without an explicit requirement and risk assessment.
- Do not disable route guards in production without cause; guest demo mode must be clearly separated.
- Minimize personal data in chat logs and API requests; follow the privacy policy from the product spec.

---

## 5. Stack and code style

- **Angular + TypeScript:** follow existing module structure, typing, and patterns in the repo.
- **UI:** PrimeNG + Tailwind as configured; responsive where possible; keyboard, contrast, readability (**WCAG** as a target). PrimeNG upgrades: **community (MIT) only**—do not use packages whose version suffix is `-lts` (commercial LTS track).
- **Localization:** user-visible strings in Ukrainian (`@angular/localize` or ngx-translate as configured in the project).
- **Tests:** Jasmine/Karma in line with Angular CLI for non-trivial logic.

---

## 6. Documentation changes

- If the functional concept or stack changes, update **`README.md`** and keep **`../app/app.txt`** / **`../app/stack.txt`** in sync with the code.
- Keep this file concise; details belong in `README.md` and `app/`.

---

## 7. Handoff to the user

After substantive changes, summarize briefly: what changed, which files, whether migrations or env vars are needed (e.g. Supabase). Never commit secrets.

---

## 8. Admin (roles, classes, blocking)

- **SQL:** `supabase/admin.sql` after `profiles.sql`. First admin: `update public.profiles set role = 'admin' where id = '<uuid>';` for your auth user.
- **App:** route `/admin` (guards: `authGuard`, `adminGuard`). Header shows «Адмін» when `cachedProfile.role === 'admin'`.
- **RLS:** `public.is_current_user_admin()` (security definer) avoids recursive policy checks on `profiles`.
