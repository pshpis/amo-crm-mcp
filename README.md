# amo-crm-mcp

Модульный MCP сервер на TypeScript на базе `@modelcontextprotocol/sdk`. Базовая сборка использует stdio-транспорт и предоставляет инструменты `server-health` и `get_active_tasks` (AmoCRM).

## Требования
- Node.js 18+

## Установка и запуск
```bash
npm install
npm run dev          # запуск через tsx
npm run build
npm start            # запускает собранный dist/index.js
npm run inspector    # сборка + запуск инспектора stdio на dist/index.js
```

Дополнительно: `LOG_LEVEL=debug npm run dev` для детальных логов (stderr).

## Переменные окружения
- Скопируйте `.env.example` в `.env` и заполните значения для AmoCRM (base URL `/api/v4/`, integration id/secret/key).
- Загрузка `.env` выполняется через `dotenv` в `src/config/env.ts`, схема описана через `zod`. Невалидные значения приводят к ошибке при старте.
- `AMO_MAX_CONCURRENCY` — максимальное число параллельных запросов к AmoCRM (по умолчанию 5). См. `src/core/amo/`.

## Архитектура
- `src/index.ts` — точка входа, инициализация `ServerApp`.
- `src/config/` — конфигурация сервера (`name`, `version`, `description`) из `package.json` и типизированные переменные окружения из `.env`.
- `src/core/` — Amo-специфичные классы (контекст, AmoService) поверх базовых.
- `src/lib/` — базовая инфраструктура (логгер, `BaseServerContext`, `BaseServerApp`, `BaseModule`, `BaseController`, `SingletonStorage`) для переиспользования в других MCP серверах.
- `src/modules/` — независимые модули. Каждый реализует `BaseModule` и регистрирует свои инструменты/ресурсы/промпты.
- `src/modules/health/` — инструмент `server-health`.
- `src/modules/amo-tasks/` — инструмент `get_active_tasks` (список активных задач из AmoCRM).

## Инструмент `server-health`
- Имя: `server-health`
- Описание: возвращает метаданные, аптайм, загрузку CPU, использование памяти и окружение процесса.
- Результат: `structuredContent` с подробным JSON + текстовое резюме в `content`.

## Добавление новых модулей
1. Создать папку в `src/modules/<module>/`, описать схемы (`schemas`), сервис (бизнес-логика), контроллер (описание инструментов через `getTools`) и модуль (`BaseModule`).
2. Зарегистрировать модуль в `src/modules/index.ts`.
3. В контроллере использовать `wrapTool` для унифицированной обработки ошибок, `registerTools` модуля — для регистрации всех инструментов.
