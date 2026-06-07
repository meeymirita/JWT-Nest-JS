# NestJS Course — Auth API

REST API на NestJS с регистрацией, входом, JWT-авторизацией и документацией Swagger.

---

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Стек технологий](#стек-технологий)
3. [Структура проекта](#структура-проекта)
4. [Архитектура](#архитектура)
5. [Описание модулей и файлов](#описание-модулей-и-файлов)
6. [API эндпоинты](#api-эндпоинты)
7. [Поток авторизации](#поток-авторизации)
8. [Полезные команды](#полезные-команды)

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/course_db?schema=public"
NODE_ENV=development
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d
COOKIE_DOMAIN=localhost
PORT=3000
```

### 3. База данных

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Запуск

```bash
npm run start:dev   # режим разработки
npm run build       # сборка
npm run start:prod  # продакшен
```

### 5. Swagger

- UI: `http://localhost:3000/api`
- JSON: `http://localhost:3000/api-json`

---

## Стек технологий

| Пакет | Назначение |
|---|---|
| **@nestjs/core, common, platform-express** | Фреймворк NestJS |
| **@nestjs/config** | Загрузка переменных из `.env` |
| **@nestjs/jwt** | Создание и проверка JWT-токенов |
| **@nestjs/passport + passport-jwt** | Авторизация через Bearer-токен |
| **@nestjs/swagger** | OpenAPI/Swagger документация |
| **prisma + @prisma/client** | ORM для PostgreSQL |
| **class-validator + class-transformer** | Валидация входящих данных |
| **argon2** | Хеширование паролей |
| **cookie-parser** | Чтение cookies из HTTP-запросов |

---

## Структура проекта

```
course/
├── prisma/
│   └── schema.prisma              # Схема БД
├── src/
│   ├── main.ts                    # Точка входа
│   ├── app.module.ts              # Корневой модуль
│   ├── app.controller.ts          # Тестовый контроллер (Hello World)
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts     # register, login, refresh, logout, me
│   │   ├── auth.service.ts        # Бизнес-логика авторизации
│   │   ├── dto/                   # DTO для валидации и Swagger
│   │   ├── decorators/            # @Authorization(), @Authorized()
│   │   ├── guards/                # JwtGuard
│   │   ├── strategies/            # JwtStrategy
│   │   └── interfaces/            # JwtPayload, SafeUser
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── config/                    # JWT, Swagger
│   ├── utils/                     # Вспомогательные функции
│   └── generated/prisma/          # Автогенерируемый Prisma Client
│
├── .env.example
└── package.json
```

---

## Архитектура

```
HTTP-запрос
    │
    ▼
main.ts  ── cookie-parser, ValidationPipe, Swagger
    │
    ▼
AppModule  ── ConfigModule, PrismaModule, AuthModule
    │
    ▼
AuthController  ── принимает запрос, вызывает AuthService
    │
    ├── @Authorization() → JwtGuard → JwtStrategy → AuthService.validate()
    └── @Authorized()    → достаёт user из request
    │
    ▼
AuthService  ── register / login / refresh / logout
    │
    ▼
PrismaService  ── запросы к PostgreSQL (таблица users)
```

Приложение построено из **модулей**. Каждый модуль объединяет контроллеры, сервисы, провайдеры и импорты других модулей.

---

## Описание модулей и файлов

### `src/main.ts`

Точка входа приложения:

```typescript
const app = await NestFactory.create(AppModule);
app.use(cookieParser.default());
app.useGlobalPipes(new ValidationPipe());
setupSwagger(app);
await app.listen(3000);
```

- **ValidationPipe** — автоматически валидирует все `@Body()` DTO через `class-validator`
- **cookieParser** — нужен для чтения `refreshToken` из cookie

---

### `src/app.module.ts`

Корневой модуль, подключает:

- `ConfigModule.forRoot({ isGlobal: true })` — `.env` доступен во всех модулях
- `PrismaModule` — работа с БД
- `AuthModule` — авторизация

---

### `src/prisma/`

**`prisma/schema.prisma`** — модель пользователя:

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")
  @@map("users")
}
```

**`prisma.service.ts`** — обёртка над Prisma Client с подключением/отключением от БД при старте/остановке приложения.

**`prisma.module.ts`** — помечен `@Global()`, `PrismaService` доступен во всех модулях без явного импорта.

---

### `src/auth/dto/`

| Файл | Назначение |
|---|---|
| `register.dto.ts` | Валидация `{ name, email, password }` при регистрации |
| `login.dto.ts` | Валидация `{ email, password }` при входе |
| `auth.dto.ts` | Swagger-описание ответа `{ accessToken }` |
| `user.dto.ts` | Swagger-описание объекта пользователя |

---

### `src/auth/auth.service.ts`

| Метод | Описание |
|---|---|
| `register()` | Проверяет email → хеширует пароль (argon2) → создаёт пользователя → выдаёт токены |
| `login()` | Проверяет email и пароль → выдаёт токены |
| `refresh()` | Проверяет refreshToken из cookie → выдаёт новую пару токенов |
| `logout()` | Очищает cookie refreshToken |
| `validate()` | Загружает пользователя без поля `password` (для JWT-стратегии) |

**Схема токенов:**

- **Access Token** — короткоживущий (`JWT_ACCESS_TOKEN_TTL`), передаётся в заголовке `Authorization: Bearer <token>`
- **Refresh Token** — долгоживущий (`JWT_REFRESH_TOKEN_TTL`), хранится в **httpOnly cookie**

Срок жизни cookie синхронизирован с `exp` refresh-токена.

---

### `src/auth/auth.controller.ts`

| Метод | URL | Auth | Описание |
|---|---|---|---|
| POST | `/auth/register` | — | Регистрация |
| POST | `/auth/login` | — | Вход |
| POST | `/auth/refresh` | cookie | Обновление токенов |
| POST | `/auth/logout` | cookie | Выход |
| GET | `/auth/me` | Bearer JWT | Текущий пользователь |

- **`@Res({ passthrough: true })`** — позволяет сервису записать cookie, сохраняя автоматический JSON-ответ NestJS
- **`@Authorization()`** — включает JwtGuard на защищённых роутах
- **`@Authorized()`** — достаёт `user` из request (положен Passport после проверки JWT)

---

### `src/auth/strategies/jwt.strategy.ts`

Passport-стратегия для JWT:

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: configService.getOrThrow('JWT_SECRET'),
  algorithms: ['HS256'],
});

async validate(payload: JwtPayload) {
  return await this.authService.validate(payload.userId);
}
```

Passport извлекает Bearer-токен, проверяет подпись и срок, вызывает `validate()`, результат записывает в `request.user`.

---

### `src/auth/guards/auth.guard.ts`

```typescript
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
```

При невалидном токене автоматически возвращается **401 Unauthorized**.

---

### `src/auth/decorators/`

**`@Authorization()`** — обёртка над `UseGuards(JwtGuard)`, помечает роут как защищённый.

**`@Authorized()`** — параметр-декоратор, возвращает текущего пользователя из request. Можно передать поле: `@Authorized('id')`.

---

### `src/config/jwt.config.ts`

Конфигурация JwtModule:

```typescript
export function getJwtConfig(configService: ConfigService): JwtModuleOptions {
  return {
    secret: configService.getOrThrow('JWT_SECRET'),
    signOptions: { algorithm: 'HS256' },
    verifyOptions: { algorithms: ['HS256'], ignoreExpiration: false },
  };
}
```

---

### `src/config/swagger.config.ts` + `src/utils/swagger.util.ts`

Настройка Swagger UI на `/api` с поддержкой Bearer Auth.

---

### `src/utils/is-dev-utils.ts`

Определяет dev-режим по `NODE_ENV`. Используется для настройки cookie:

- dev: `secure: false`, `sameSite: 'lax'`
- prod: `secure: true`, `sameSite: 'strict'`

---

## API эндпоинты

### POST `/auth/register`

**Тело:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Ответ (201):**
```json
{ "accessToken": "eyJhbG..." }
```

+ cookie `refreshToken` (httpOnly)

---

### POST `/auth/login`

**Тело:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Ответ (200):** `{ "accessToken": "..." }` + cookie

**Ошибка (401):** `{ "message": "Неверный email или пароль" }`

---

### POST `/auth/refresh`

Без тела. Берёт `refreshToken` из cookie.

**Ответ (200):** новый `{ "accessToken": "..." }` + обновлённая cookie

---

### POST `/auth/logout`

**Ответ (200):** `{ "message": "Вы успешно вышли из системы" }`

Cookie `refreshToken` очищается.

---

### GET `/auth/me`

**Заголовок:** `Authorization: Bearer <accessToken>`

**Ответ (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

Поле `password` в ответ не попадает.

---

## Поток авторизации

```
1. Регистрация / Вход
   Client → POST /auth/register или /auth/login
   Server → проверяет данные → создаёт JWT
   Server → accessToken в JSON + refreshToken в httpOnly cookie

2. Защищённый запрос
   Client → GET /auth/me + Authorization: Bearer <accessToken>
   Server → JwtGuard → JwtStrategy → validate(userId) → request.user
   Server → возвращает данные пользователя

3. Обновление токена (access истёк)
   Client → POST /auth/refresh (cookie отправляется автоматически)
   Server → проверяет refreshToken → выдаёт новую пару

4. Выход
   Client → POST /auth/logout
   Server → удаляет cookie
```

---

## Полезные команды

```bash
npx prisma studio          # GUI для просмотра БД
npx prisma generate        # пересоздать клиент после изменения schema
npm run lint               # линтер
npm run test               # unit-тесты
npm run test:e2e           # e2e-тесты
```

---

## Лицензия

UNLICENSED — учебный проект.
