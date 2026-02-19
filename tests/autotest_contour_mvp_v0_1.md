# IMPULSE MVP - Autotest Contour (v0.1)

## 1) Goal
Заложить минимальный, но рабочий контур автотестов для MVP-1:
- рано ловить регрессии в критических флоу,
- гарантировать mobile-first качество,
- обеспечить быстрый релиз-цикл.

## 2) Scope
Автотесты покрывают только MVP-1:
1. 5 публичных страниц доступны и рендерятся.
2. Гейтинг диагностики через обязательный Google auth.
3. Consent checkbox перед стартом теста.
4. Психосоматический тест: прохождение, расчёт, inline результат.
5. Переход в продукты/консультацию.
6. Отправка заявки на консультацию.
7. Базовая админка: users/progress/content/leads.
8. RU/EN переключение.

Out of scope:
- Полная физическая система тестов.
- Нагрузочное/хаос-тестирование.
- Визуальные snapshot-тесты на все экраны.

## 3) Test Stack
- E2E: `Playwright`.
- Domain/unit: `Vitest` (или эквивалент) для функционального ядра.
- Property tests: `fast-check` (или эквивалент) для инвариантов scoring.
- API/checks: `Supabase` read/write contract assertions.
- CI: GitHub Actions (или эквивалентный раннер).

## 4) Environments
- `local` - разработка.
- `preview` - pre-release validation.
- `prod smoke` - только короткий smoke после деплоя.

## 5) Browser Matrix
1. `WebKit` (iPhone profile) - приоритет #1.
2. `Chromium` (mobile viewport) - приоритет #2.
3. `Chromium desktop` - sanity.

## 6) Test Layers

### 6.1 PR smoke (обязательный)
1. `/` загружается, есть основной CTA.
2. `/diagnostics` без auth показывает login gate.
3. Footer содержит дисклеймер.
4. `/products`, `/knowledge`, `/about` открываются.
5. RU/EN переключение не ломает роутинг.

### 6.2 Domain core (обязательный на каждый PR)
1. Scoring функции детерминированы (один вход = один выход).
2. `overall_pct` всегда в диапазоне `0..100`.
3. При ухудшении ответа score не улучшается (монотонность).
4. `Q14` не влияет на `overall_pct`, но влияет на `risk_flags`.
5. Маппинг `overall_pct -> level` корректен на границах диапазонов.

### 6.3 Contract tests (adapter layer)
1. Сохранение test session в Supabase не теряет обязательные поля.
2. Повторный save черновика не создает дубликаты (идемпотентность).
3. Политики RLS не дают пользователю читать чужие результаты.
4. Admin role имеет доступ к leads/progress/content, user role - нет.

### 6.4 Critical path regression (nightly / pre-release)
1. Auth -> diagnostics доступен.
2. Consent checkbox required перед стартом теста.
3. Прохождение 16 вопросов.
4. Inline результаты отрисованы (`overall_pct`, `level`, рекомендации).
5. Сохранение результата в истории пользователя.
6. Консультационная форма отправляется.
7. Админ видит новую заявку.
8. Админ видит прогресс пользователя.

### 6.5 Prod smoke
1. Главная доступна.
2. Diagnostics gate работает.
3. Products page и lead form доступны.

## 7) Google Auth in CI
Реальный OAuth в e2e нестабилен и часто блокируется антибот-защитой.

MVP-решение:
1. Проверять, что `Sign in with Google` инициирует auth flow.
2. Для глубоких e2e использовать pre-authenticated test session (через Supabase service key в test env).
3. Полный "живой" OAuth проход делать ручным release-checklist перед релизом.

## 8) Test Data Strategy
- Отдельный тестовый Supabase project или отдельная schema.
- Seed:
  - `admin_user`
  - `regular_user`
  - 1 опубликованная KB категория + 2 карточки
  - 1 продукт
- Cleanup после прогонов: lead/test_sessions/test_results.

## 9) Required Test IDs (contract for frontend)
Минимум атрибутов:
- `data-testid="google-auth-button"`
- `data-testid="consent-checkbox"`
- `data-testid="start-psychotest-button"`
- `data-testid="question-next-button"`
- `data-testid="result-overall-pct"`
- `data-testid="result-level"`
- `data-testid="result-recommendations"`
- `data-testid="cta-go-products"`
- `data-testid="consultation-form-submit"`
- `data-testid="admin-leads-table"`

## 10) CI Contour
1. `lint` (после появления кода).
2. `build`.
3. `unit + property tests` (functional core).
4. `contract tests` (Supabase adapters).
5. `playwright smoke` (chromium + webkit mobile).
6. `artifact upload` (trace/video on failure).

Blocking policy:
- Unit/property/contract/smoke mandatory for merge.
- Critical path mandatory для релизного тега.

## 11) Exit Criteria for MVP-1
1. Все PR smoke тесты стабильны (>= 95% pass rate за 20 прогонов).
2. Critical path green на release branch.
3. Нулевые blocker-баги по iOS Safari.
