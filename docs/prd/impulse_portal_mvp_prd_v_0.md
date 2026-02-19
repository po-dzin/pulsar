# IMPULSE Portal - MVP PRD (v0.2 Lock Spec)

> Purpose: запустить рабочий mobile-first MVP портала IMPULSE с сохранением прогресса пользователя, психосоматическим тестом и базовым контуром контента/заявок.

---

## 0) What Changed Since v0.1
- Зафиксировано: публично ровно 5 основных страниц.
- Зафиксировано: `Google Auth` обязателен для тестов и сохранения прогресса.
- Зафиксировано: в MVP реализуем только психосоматический тест (физическая система тестов переносится на post-MVP).
- Зафиксировано: результаты + рекомендации + оффер консультации показываются inline на странице диагностики после завершения теста.
- Зафиксировано: консультация как основной оффер живет на странице продуктов/курсов.
- Зафиксировано: backend на `Supabase`, языки `RU/EN`, mobile-first с приоритетом `iOS Safari` и `Chrome`.

---

## 1) Product Summary
**IMPULSE Portal** - входная система, где пользователь:
1. входит через Google,
2. проходит психосоматический тест,
3. получает процент/уровень/зоны и персональные рекомендации,
4. двигается к консультации и продуктам,
5. возвращается в личный прогресс.

Core loop (MVP-1):
`Авторизация -> Диагностика -> Результат/рекомендации -> Продукты/консультация -> Возврат в прогресс`

---

## 2) MVP Boundary
**MVP-1 = 5 публичных страниц + обязательный Google Auth + психосоматический тест end-to-end + inline результаты + минимальная админка + Supabase.**

---

## 3) Locked Decisions

### 3.1 Public IA (5 main pages)
1. **Mission** (`/`)  
2. **Diagnostics / Tests** (`/diagnostics`)  
3. **Products / Courses / Consultation** (`/products`)  
4. **Knowledge Base** (`/knowledge`)  
5. **About Author** (`/about`)  

Notes:
- Экран результатов и рекомендаций не отдельная страница: это state на `/diagnostics`.
- Консультация не отдельная страница: блок/форма на `/products`.

### 3.2 Auth
- `Google OAuth` обязателен.
- Без авторизации прохождение теста недоступно.
- Причина: нужно сохранять прогресс и историю результатов.

### 3.3 Tests
- **В MVP-1 реализуется только психосоматический тест.**
- **Физическая система (10 тестов, 5 категорий)** переносится на post-MVP как отдельный этап (возможен отдельный page/flow).

### 3.4 Scoring strategy in MVP-1
- Пока нет объединенного индекса между разными тестами.
- Для каждого теста хранится отдельный score и отдельная история.

### 3.5 Consent and disclaimer
- Перед началом теста обязательный чекбокс согласия.
- В футере на всех страницах дисклеймер: инструмент самонаблюдения, не медицинский диагноз.
- Отдельная policy page - post-MVP.

### 3.6 Admin scope (MVP-1)
- Пользователи и их прогресс.
- Контент БЗ (категории и карточки).
- Заявки на консультации/будущие курсы.

### 3.7 Localization
- RU и EN.

---

## 4) Users and Jobs

### 4.1 Primary user
Человек, который хочет быстро оценить текущее состояние и получить первый прикладной шаг.

JTBD:
- Понять текущее состояние без иллюзий.
- Получить понятные действия без перегруза.
- Перейти в продукт/консультацию, если нужна более глубокая работа.

### 4.2 Admin
Команда, которая:
- видит профиль/прогресс пользователей,
- управляет БЗ,
- принимает заявки на консультацию.

---

## 5) User Flows (MVP-1)

### Flow A: Auth + diagnostics
1. Пользователь открывает `/diagnostics`.
2. Не авторизован -> CTA `Войти через Google`.
3. Авторизован -> видит intro + чекбокс согласия + старт теста.
4. Проходит 16 вопросов психосоматического теста.
5. Получает inline:
   - общий процент,
   - уровень,
   - зоны (сильные/рост),
   - рекомендации,
   - CTA на `/products` и `/knowledge`.

### Flow B: Consultation
1. Пользователь открывает `/products`.
2. Выбирает продукт или блок консультации.
3. Отправляет заявку.
4. Заявка фиксируется в Supabase и видна в админке.

### Flow C: Progress
1. Авторизованный пользователь в `/diagnostics` видит историю своих результатов.
2. Может открыть прошлый результат и сравнить динамику.

### Flow D: Admin
1. Админ входит в `/admin`.
2. Видит users/progress, KB content, consultation leads.
3. Редактирует контент БЗ и статусы заявок.

---

## 6) Functional Requirements

### 6.1 Auth
- Google OAuth login/logout.
- Session persistence.
- Guard для тестового flow (без auth не пускать в опрос).

### 6.2 Psychosomatic test engine
- 16 вопросов.
- Поддержка RU/EN текстов.
- Автосохранение прогресса (черновик) после каждого ответа.
- Повторный проход теста доступен в любое время.

#### 6.2.1 Scoring (MVP default)
Используем вариант, оптимальный для честной интерпретации:
- `Q14 (травмы/операции/ДТП)` не входит в общий %.
- `Q14` формирует отдельный риск-флаг для интерпретации.

Базовые баллы ответов:
- `Нет/Не ощущаю` = 100
- `Редко` = 75
- `Иногда` = 50
- `Часто` = 25

Спец-вопросы:
- `Q11 (время сна)` -> 100/75/50/25 от лучшего к худшему.
- `Q12 (энергия)` -> 100/75/50/25 от лучшего к худшему.

Overall formula (MVP-1):
- `overall_pct = round(sum(Q1..Q13, Q15, Q16) / 15)`

#### 6.2.2 Level interpretation
- `85-100` -> Resource
- `65-84` -> Background tension
- `45-64` -> Persistent clamps
- `0-44` -> Defense mode

#### 6.2.3 Output payload
- `overall_pct`
- `level`
- `zones_strong[]`
- `zones_growth[]`
- `risk_flags[]` (включая `Q14`)
- `recommendations[]`
- `created_at`

### 6.3 Recommendations
- Автоматические рекомендации зависят от уровня и зон.
- Формат выдачи:
  - ежедневные практики,
  - профилактика,
  - следующий шаг (CTA).

### 6.4 Products and consultation
- Каталог продуктов карточками.
- Блок консультации с формой заявки:
  - имя,
  - email/telegram,
  - краткий запрос,
  - согласие на обработку данных.

### 6.5 Knowledge base
- Карточки категорий и материалов.
- Read-only для пользователя.
- CRUD из админки.

### 6.6 Admin panel
- `Users`: список, базовые профили, дата входа.
- `Progress`: результаты тестов, даты, динамика.
- `KB`: категории/карточки.
- `Leads`: заявки, статусы (`new`, `in_progress`, `done`, `archived`).

### 6.7 Analytics (minimum)
- `view_page_{route}`
- `auth_google_start`
- `auth_google_success`
- `test_psycho_start`
- `test_psycho_progress_saved`
- `test_psycho_complete`
- `test_result_view`
- `cta_products_click`
- `cta_consult_submit`
- `kb_card_open`
- `admin_lead_status_changed`

---

## 7) Non-Functional Requirements

### 7.1 Mobile-first
- Основной UX таргет: мобильный экран.
- Приоритет браузеров:
  1. iOS Safari (критический),
  2. Chrome mobile.

### 7.2 Performance targets (MVP)
- LCP <= 2.8s на мобильном 4G профиле.
- CLS < 0.1.
- INP < 200ms на ключевых экранах.

### 7.3 Reliability
- Не терять ответы при перезагрузке/обрыве.
- Retry для сетевых сбоев.

### 7.4 Security and privacy
- RLS в Supabase для пользовательских данных.
- Пользователь читает только свои результаты.
- Админ доступ только по роли.

### 7.5 Functional programming quality bar (mandatory)
- Архитектурный принцип: `Functional Core, Imperative Shell`.
- Весь scoring/recommendation домен - чистые функции без побочных эффектов.
- UI и API слои только оркестрируют эффекты (I/O, auth, DB, analytics).
- Логика теста как явная state machine (`idle -> in_progress -> completed -> persisted`).
- Ошибки моделируются типами (`Result`/`Either`-подход), без "тихих" падений.
- Общие правила и пороги задаются как данные (config), а не захардкоженная логика.
- Публичные доменные функции детерминированы и референциально прозрачны.

### 7.6 Stability and scalability constraints
- Все write-операции идемпотентны там, где это возможно.
- Автосохранение ответов устойчиво к повторным запросам/потере сети.
- Явные таймауты и retry-policy для сетевых эффектов.
- Контракты между слоями версионируются (DTO/schema version).
- Добавление нового теста не должно ломать текущий психосоматический flow.

### 7.7 Human-centered usability constraints
- Один экран - одна основная задача и один главный CTA.
- Минимальная когнитивная нагрузка: короткие блоки текста, понятные формулировки.
- Ошибки объясняют "что сделать дальше", а не только "что пошло не так".
- Прогресс теста всегда видим пользователю.
- Доступность: клавиатурная навигация, контраст, корректные ARIA-labels.

---

## 8) Data Model (Supabase, MVP-1)

### 8.1 Core tables
- `profiles` (`id`, `email`, `full_name`, `locale`, `created_at`)
- `test_sessions` (`id`, `user_id`, `test_type`, `status`, `started_at`, `completed_at`)
- `test_answers` (`id`, `session_id`, `question_key`, `answer_key`, `score`, `meta`)
- `test_results` (`id`, `session_id`, `user_id`, `test_type`, `overall_pct`, `level`, `zones`, `risk_flags`, `recommendations`, `created_at`)
- `products` (`id`, `slug`, `title_ru`, `title_en`, `description_ru`, `description_en`, `is_active`)
- `consultation_leads` (`id`, `user_id`, `name`, `contact`, `message`, `status`, `created_at`, `updated_at`)
- `kb_categories` (`id`, `slug`, `title_ru`, `title_en`, `sort_order`)
- `kb_articles` (`id`, `category_id`, `slug`, `title_ru`, `title_en`, `excerpt_ru`, `excerpt_en`, `is_published`, `published_at`)
- `admin_roles` (`user_id`, `role`)
- `event_log` (`id`, `user_id`, `event_name`, `payload`, `created_at`)

### 8.2 Access model
- `user`: свои результаты/заявки.
- `admin`: read/write для контента, лидов, обзор пользователей.

---

## 9) Tech Direction (MVP-1)
- Frontend: Next.js + TypeScript (App Router).
- UI: токены из брендбука `v0.1`.
- Backend: Supabase (Auth + Postgres + RLS + storage/edge при необходимости).
- i18n: RU/EN.

### 9.1 Application architecture
- Слои:
  1. `domain` (pure functions: scoring, interpretation, recommendations),
  2. `application` (use-cases/orchestration),
  3. `infrastructure` (Supabase adapters, auth adapters, analytics adapters),
  4. `ui` (React components + route handlers).
- Domain не импортирует infra/UI.
- Все эффекты инжектятся в use-cases через интерфейсы/ports.

### 9.2 Domain modeling rules
- Question/Answer/Score/Level/Zones задаются как строгие типы.
- Запрещено передавать "сырые" объекты между слоями без маппинга.
- Интерпретация результата и риск-флаги полностью вычисляются в domain-слое.

### 9.3 Test strategy for FP core
- Unit-тесты на все доменные функции scoring/recommendations.
- Property-based подход для инвариантов:
  - границы score (`0..100`),
  - монотонность шкалы ответов,
  - стабильность результата при одинаковом входе.
- Contract tests для адаптеров Supabase.

---

## 10) Milestones

1. **M0 - Lock spec and schema (1-2 days)**
- Подтвердить scoring contract психосоматики.
- Утвердить схему таблиц и роли.

2. **M1 - App skeleton (3-4 days)**
- Каркас 5 страниц.
- i18n RU/EN.
- Footer disclaimer.
- Базовый каркас слоев `domain/application/infrastructure/ui`.

3. **M2 - Auth + diagnostics engine (4-6 days)**
- Google OAuth.
- Тестовый flow + автосохранение + inline results.
- Чистые функции scoring/recommendations + unit tests.

4. **M3 - Products/consultation + KB + admin basic (4-6 days)**
- Форма консультации.
- KB read + admin CRUD.
- Leads/statuses/users/progress в админке.
- Contract tests для Supabase adapters.

5. **M4 - QA + release (2-3 days)**
- Mobile regression (iOS Safari + Chrome).
- Проверка аналитики.
- Launch.
- Проверка FP-инвариантов и ошибок деградации UX.

---

## 11) Definition of Done
- 5 публичных страниц доступны и адаптивны.
- Google auth обязателен и работает стабильно.
- Психосоматический тест проходит end-to-end.
- Inline результаты и рекомендации отображаются корректно.
- История прогресса пользователя сохраняется.
- Консультационные заявки пишутся в Supabase и видны в админке.
- БЗ доступна пользователю и редактируется админом.
- В футере есть дисклеймер, перед тестом - чекбокс согласия.
- Минимальная аналитика событий фиксируется.
- Базовый контур автотестов добавлен в репозиторий.
- Domain-логика психосоматического теста покрыта unit/property тестами.
- Эффекты изолированы от domain-логики (functional core не зависит от I/O).
- Ключевые UX-флоу проходят e2e на webkit-mobile и chromium-mobile.

---

## 12) Out of Scope (MVP-1)
- Полная физическая система тестов (10 тестов, 5 категорий).
- Объединенный кросс-тестовый score.
- SF graph integrations.
- Полная юридическая страница policy/terms (кроме базового consent + disclaimer).

---

## 13) Post-MVP Backlog
1. Внедрение физической системы тестов как отдельного flow/page.
2. Объединенный индекс состояния по нескольким тестам.
3. Углубленная аналитика и cohort tracking.
4. Расширение админки (редактор правил рекомендаций).
5. Интеграции (SF, CRM, расширенные нотификации).
