# amo-crm-mcp

Модульный MCP сервер на TypeScript на базе `@modelcontextprotocol/sdk`. Базовая сборка использует stdio-транспорт и предоставляет метод `server-health` для получения информации о состоянии сервера.

## Требования
- Node.js 18+

## Установка и запуск
```bash
npm install
npm run dev   # запуск через tsx
# либо
npm run build
npm start     # запускает собранный dist/server.js
```

Дополнительно: `LOG_LEVEL=debug npm run dev` для детальных логов.

## Переменные окружения
- Скопируйте `.env.example` в `.env` и заполните значения для AmoCRM (base URL `/api/v4/`, integration id/secret/key).
- Загрузка `.env` выполняется через `dotenv` в `src/config/env.ts`, схема описана через `zod`. Невалидные значения приводят к ошибке при старте.
- `AMO_MAX_CONCURRENCY` — максимальное число параллельных запросов к AmoCRM (по умолчанию 5). См. `src/core/amo/`.

## Архитектура
- `src/server.ts` — точка входа, инициализация контекста, сервер MCP и модули.
- `src/config/` — конфигурация сервера (`name`, `version`, `description`) из `package.json` и типизированные переменные окружения из `.env`.
- `src/core/` — общие компоненты: логгер, контекст (время старта, uptime), фабрика сервера с подключением транспорта, AmoCRM сервис с лимитом параллельности.
- `src/modules/` — независимые модули. Каждый реализует `ServerModule` и регистрирует свои инструменты/ресурсы/промпты.
- `src/modules/health/` — пример модуля, регистрирует MCP-инструмент `server-health`.

## Инструмент `server-health`
- Имя: `server-health`
- Описание: возвращает метаданные, аптайм, загрузку CPU, использование памяти и окружение процесса.
- Результат: `structuredContent` с подробным JSON + текстовое резюме в `content`.

## Добавление новых модулей
1. Создать папку в `src/modules/<module-name>/` и экспортировать `ServerModule` c методом `register`.
2. Зарегистрировать модуль в `src/modules/index.ts`.
3. Опционально добавить схемы ввода/вывода через `zod` и использовать `server.registerTool`, `registerResource` или `registerPrompt`.
