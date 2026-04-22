# NL-to-SQL

Система преобразования естественного языка в SQL для кейса Drivee — сервиса вызова такси с уникальной фичей: пользователи сами устанавливают цену за поездку, а водители могут принять предложение или дать свою цену.

## Постановка задачи

Пользователи могут задавать вопросы о данных поездок на естественном языке. Система генерирует SQL-запрос и возвращает результат.

## Схема данных

Система работает с таблицей `orders`, содержащей:

**Идентификаторы:**
- `order_id` — анонимизированный идентификатор заказа
- `tender_id` — анонимизированный идентификатор тендера (предложения)
- `user_id` — анонимизированный идентификатор пользователя
- `driver_id` — анонимизированный идентификатор водителя

**Статусы:**
- `status_order` — итоговый статус заказа (например, "done", "cancelled")
- `status_tender` — статус тендера (например, "done", "decline")

**Временные метки:**
- `order_timestamp` — когда заказ создан
- `tender_timestamp` — когда создан тендер
- `driveraccept_timestamp` — когда водитель принял
- `driverarrived_timestamp` — когда водитель приехал
- `driverstarttheride_timestamp` — когда поездка началась
- `driverdone_timestamp` — когда поездка завершена
- `clientcancel_timestamp` — когда пользователь отменил
- `drivercancel_timestamp` — когда водитель отменил

**Метрики:**
- `distance_in_meters` — расстояние поездки
- `duration_in_seconds` — длительность поездки
- `price_order_local` — итоговая цена заказа
- `price_tender_local` — цена в тендере
- `price_start_local` — стартовая оценка цены

## Технологии

- **Backend:** FastAPI (Python 3.11)
- **Frontend:** React + Vite
- **База данных:** PostgreSQL
- **LLM:** Локальный Ollama (Gemma 4) (Временно, можно заменить на OpenAI API или Gigchat API для тестирования)
- **Контейнеризация:** Docker + Docker Compose

## Запуск

```bash
# Запустить сервисы
docker compose up -d

# Доступ к сервисам
- Фронтенд: http://localhost:5173
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
```

## Структура проекта

```
apps/
├── api/      # FastAPI backend с логикой NL-to-SQL
└── web/      # React frontend
```

## Разработка

```bash
# Посмотреть логи
docker-compose logs -f

# Пересобрать
docker-compose build
```
