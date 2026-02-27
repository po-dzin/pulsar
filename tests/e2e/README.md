# E2E Contour

Каталог содержит smoke и auth-dependent сценарии MVP-1.

## Набор
1. `smoke.spec.ts` - публичные маршруты, дисклеймер, auth gate.
2. `navigation-ui.spec.ts` - язык, тема, мобильное burger-меню.
3. `diagnostics-psychosomatic.spec.ts` - guest auth-gate + authenticated consent/start/restart/pending save.
4. `diagnostics-physical.spec.ts` - guest auth-gate + authenticated happy-path физического теста.
5. `products-knowledge.spec.ts` - продукты/заявка + чтение статьи БЗ.
6. `profile-auth.spec.ts` - кабинет, история тестов, фильтры, PDF-скачивание (pre-auth).
7. `admin-basic.spec.ts` - админ-панель и смена статуса лида (admin pre-auth).
8. `admin-content-crud.spec.ts` - full CRUD контур БЗ в админке: create/preview/publish/delete + reorder categories.

## Быстрый запуск
```bash
npm run test:e2e:smoke
npm run test:e2e:core
```

## Auth-запуск
```bash
E2E_AUTHENTICATED=1 E2E_STORAGE_STATE=tests/e2e/.auth/user.json npm run test:e2e:auth:user
E2E_AUTHENTICATED=1 E2E_STORAGE_STATE=tests/e2e/.auth/admin.json npm run test:e2e:auth:admin
# полный auth-контур (нужен admin storage)
E2E_AUTHENTICATED=1 E2E_STORAGE_STATE=tests/e2e/.auth/admin.json npm run test:e2e:auth
```

## Как записать storageState
```bash
# Перед записью запусти локальный сайт:
# npm run dev -- --hostname 127.0.0.1 --port 3000

# 1) user-session
npm run e2e:auth:record:user

# 2) admin-session (аккаунт с ролью admin в таблице admin_roles)
npm run e2e:auth:record:admin
```

## CI/nightly auto storage-state
Можно передавать state как JSON или base64 JSON через env:
```bash
E2E_STORAGE_STATE_USER='{"cookies":[],"origins":[]}' npm run e2e:auth:state:user
E2E_STORAGE_STATE_ADMIN='{"cookies":[],"origins":[]}' npm run e2e:auth:state:admin
```

Если Google продолжает блокировать вход, запусти через системный Chrome-канал:
```bash
E2E_AUTH_RECORD_CHANNEL=chrome npm run e2e:auth:record:user
```

## Переменные
1. `E2E_BASE_URL` - базовый URL стенда.
2. `E2E_WEB_SERVER_COMMAND` - команда старта web server для Playwright.
3. `E2E_AUTHENTICATED=1` - включает тесты, требующие OAuth сессию.
4. `E2E_FULL_MOBILE_MATRIX=1` - включает WebKit iPhone проект.
5. `E2E_STORAGE_STATE` - путь к JSON-файлу с сохраненной OAuth-сессией Playwright.
6. Тесты `profile-auth` и часть `products/diagnostics` требуют актуальную авторизованную сессию Supabase в браузерном контексте.
7. `E2E_STORAGE_STATE_USER` / `E2E_STORAGE_STATE_ADMIN` - JSON/base64 JSON для автоподготовки auth state в CI/nightly.
