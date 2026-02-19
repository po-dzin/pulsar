# E2E Contour

Каталог содержит smoke и auth-dependent сценарии MVP-1.

## Набор
1. `smoke.spec.ts` - публичные маршруты, дисклеймер, auth gate.
2. `diagnostics-psychosomatic.spec.ts` - полный флоу теста (требует pre-auth).
3. `admin-basic.spec.ts` - админ-панель и смена статуса лида (требует admin pre-auth).

## Быстрый запуск
```bash
npm run test:e2e:smoke
```

## Переменные
1. `E2E_BASE_URL` - базовый URL стенда.
2. `E2E_WEB_SERVER_COMMAND` - команда старта web server для Playwright.
3. `E2E_AUTHENTICATED=1` - включает тесты, требующие OAuth сессию.
4. `E2E_FULL_MOBILE_MATRIX=1` - включает WebKit iPhone проект.
