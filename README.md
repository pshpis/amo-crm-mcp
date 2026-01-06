# amo-crm-mcp

MCP-сервер на TypeScript с модульной архитектурой. Базовый транспорт — stdio. Из коробки доступны инструменты `server-health` и `get_active_tasks` (AmoCRM).

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
Логи пишутся в stderr (stdout должен оставаться чистым для stdio-JSON).

## Переменные окружения
Скопируйте `.env.example` в `.env` и заполните поля для AmoCRM:
- `AMO_BASE_URL` — `https://<subdomain>.amocrm.ru/api/v4/`
- `AMO_INTEGRATION_ID`, `AMO_INTEGRATION_SECRET`, `AMO_INTEGRATION_KEY` — данные интеграции
- `AMO_MAX_CONCURRENCY` — лимит параллельных запросов (по умолчанию 5)
- `LOG_LEVEL` — уровень логирования (debug|info|warn|error)

Парсинг `.env` происходит в `src/config/env.ts` с валидацией через `zod`. При некорректных значениях сервер не стартует.

## Архитектура
- `src/index.ts` — точка входа, подключает `reflect-metadata`, поднимает `ServerApp`.
- `src/lib/` — базовый слой, переиспользуемый в других MCP-серверах:
  - `BaseServerContext`, `BaseServerApp` — жизненный цикл и контекст без бизнес-зависимостей.
  - `BaseModule`, `BaseController` — регистрация инструментов, единая обработка ошибок (`wrapTool`).
  - `SingletonStorage` — хранилище синглтонов (сервисы/контроллеры).
  - `Logger` интерфейс и `ConsoleLogger` (пишет в stderr).
- `src/core/` — Amo-специфичный слой поверх базы:
  - `AmoService` (лимитер + HTTP клиент), `AmoServerContext`, `ServerApp`.
- `src/config/` — загрузка env и серверной конфигурации из `package.json`.
- `src/modules/` — модули:
  - `health` — инструмент `server-health`.
  - `amo-tasks` — инструмент `get_active_tasks` (список активных задач из AmoCRM).

## Инструменты
### server-health
- Имя: `server-health`
- Возвращает uptime, память, loadavg, метаданные сервера. `structuredContent` — JSON снапшот, `content` — текстовое резюме.

### get_active_tasks
- Имя: `get_active_tasks`
- Возвращает активные (is_completed=0) задачи из AmoCRM. `structuredContent` имеет форму `{ tasks: [...] }`.

## Добавление нового модуля
1. Создайте папку `src/modules/<module>/`.
2. Опишите схемы (`*.schemas.ts`) через `zod`.
3. Напишите сервис (работа с API/бизнес-логика).
4. Контроллер: наследуйте `BaseController`, объявите методы-инструменты и пометьте их декоратором `@Tool({ name, title, description, outputSchema, errorLogMessage?, errorLlmMessage? })`. Обработку ошибок делайте через `wrapTool` внутри декоратора.
5. Модуль: наследуйте `BaseModule`, в `register` достаньте сервис/контроллер из `SingletonStorage` и вызовите `this.registerTools(server, controller)`.
6. Зарегистрируйте модуль в `src/modules/index.ts`.

> Декораторные метаданные методов не наследуются автоматически: при наследовании контроллеров в финальном классе нужно помечать методы `@Tool`, либо собирать `getTools()` вручную.

## Тестирование через inspector (stdio)
```bash
npm run inspector
# или вручную
npx @modelcontextprotocol/inspector node ./dist/index.js
```
Inspector сам инициализирует сервер по stdio. Не выводите ничего в stdout (логгер уже направлен в stderr); иначе парсинг JSON сломается.

## Примечания
- Для HTTP/Postman-тестов понадобится отдельный транспорт (Streamable HTTP) и обёртка над `ServerApp` — сейчас реализован только stdio.
- `reflect-metadata` подключается в `src/index.ts`. Декораторы включены в tsconfig.
