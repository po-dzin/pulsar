# Domain Test Contour (FP-first)

Этот каталог фиксирует обязательный контур тестов для функционального ядра.

## Цель
- Валидация чистых функций scoring/recommendations без I/O.
- Проверка доменных инвариантов через property-based подход.

## Минимальный набор
1. `psychosomatic.scoring.unit.spec.ts` - unit-тесты по кейсам.
2. `psychosomatic.scoring.property.spec.ts` - property-инварианты.

## Ожидаемая структура модуля (когда будет код)
- `src/domain/psychosomatic/scoring.ts`
- `src/domain/psychosomatic/interpretation.ts`
- `src/domain/psychosomatic/recommendations.ts`

## Правила
- В domain-тестах не использовать network/DB/UI.
- Тестировать только pure functions.
