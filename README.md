# Order Web

Современная React + TypeScript обёртка для запуска в Docker и подключения к удалённому бэкенду.

## Структура проекта

```
src/
  app/                # корневые провайдеры и общий каркас приложения
  pages/              # страницы
  features/           # функциональные модули (фичи)
  shared/             # переиспользуемые части (api, theme, ui)
```

## Переменные окружения

- `VITE_API_BASE_URL` — базовый URL бэкенда (по умолчанию `http://localhost:8080`).

## Запуск в Docker

```bash
docker compose up --build
```

Приложение будет доступно на `http://localhost:3000`.