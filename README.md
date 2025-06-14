# Passport-Senler Strategy Library
![Tests workflow](https://github.com/maxi-q/passport-senler/actions/workflows/test.yml/badge.svg)
![Build status](https://github.com/maxi-q/passport-senler/actions/workflows/publish.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/passport-senler.svg?style=flat-square)](https://www.npmjs.org/package/passport-senler)
[![npm downloads](https://img.shields.io/npm/dm/passport-senler.svg?style=flat-square)](https://npm-stat.com/charts.html?package=passport-senler)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=passport-senler&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.now.sh/result?p=passport-senler)

Библиотека предоставляет стратегию аутентификации для интеграции **Senler** с вашим Express приложением через **Passport.js**.

Используется только для получения токена авторизации, продолжать работу рекомендуем с библиотекой **senler-sdk**.

## Установка

Сначала установите необходимые пакеты:

```bash
npm install git+https://github.com/SenlerBot/passport-senler.git
```

## Использование
В примере будет использоваться express (passport устанавливается как зависимость passport-senler)

Вот как можно интегрировать эту библиотеку в ваше **Express.js** приложение, используя **Passport** для аутентификации через Senler:

### Пример использования с TypeScript:

```typescript
import express from 'express';
import passport from 'passport';
import { SenlerStrategy, SenlerStrategyOptions, SenlerChannel } from 'passport-senler';

const app = express();

// Типизированная конфигурация стратегии
const senlerOptions: SenlerStrategyOptions = {
  clientID: 'ВАШ_SENLER_CLIENT_ID',
  clientSecret: 'ВАШ_SENLER_CLIENT_SECRET',
  callbackURL: 'https://yourapp.com/auth/senler/callback',
  groupID: '12345', // Опционально
};

passport.use(new SenlerStrategy(senlerOptions));

// Инициализация маршрута аутентификации через Senler
app.get('/auth/senler', passport.authenticate('senler'));

// Обработчик обратного вызова для Senler
app.get(
  '/auth/senler/callback',
  passport.authenticate('senler', {
    failureRedirect: '/auth/senler/error',
    session: false, // Отключите сессии, так как библиотека passport-senler не работает с сессиями
  }),
  (req, res) => {
    // Типизированный доступ к данным пользователя
    const user = req.user as SenlerChannel;
    res.json({
      message: 'Авторизация успешна',
      accessToken: user.accessToken,
      groupId: user.groupId, // ID группы передается в колбэк
    });
  }
);

// Запуск сервера
app.listen(3000, () => {
  console.log('Приложение запущено на порту 3000');
});
```

### Пример для JavaScript:

```javascript
import express from 'express';
import passport from 'passport';
import { SenlerStrategy } from 'passport-senler';

passport.use(
  new SenlerStrategy({
    clientID: 'ВАШ_SENLER_CLIENT_ID',
    clientSecret: 'ВАШ_SENLER_CLIENT_SECRET',
    callbackURL: 'https://yourapp.com/auth/senler/callback',
  })
);

const app = express();

// Инициализация маршрута аутентификации через Senler
app.get('/auth/senler', passport.authenticate('senler'));

// Обработчик обратного вызова для Senler
app.get(
  '/auth/senler/callback',
  passport.authenticate('senler', {
    failureRedirect: '/auth/senler/error',
    session: false, // Отключите сессии, так как библиотека passport-senler не работает с сессиями
  }),
  (req, res) => {
    // Если аутентификация успешна, токен и groupId доступны через req.user
    res.json({
      accessToken: req.user.accessToken,
      groupId: req.user.groupId, // ID группы передается в колбэк
    });
  }
);

// Запуск сервера
app.listen(3000, () => {
  console.log('Приложение запущено на порту 3000');
});
```

### Объяснение:

1. **Конфигурация стратегии Senler**:
    - `clientID`: Ваш идентификатор клиента приложения **Senler**.
    - `clientSecret`: Ваш секретный ключ клиента приложения **Senler**.
    - `callbackURL`: URL, на который **Senler** перенаправит после авторизации пользователя. Домен должен быть опубликованным

2. **Маршруты**:
    - `/auth/senler`: Перенаправляет пользователей на **Senler** для аутентификации.
    - `/auth/senler/callback`: Обрабатывает обратный вызов от **Senler** после аутентификации. Если аутентификация успешна, объект пользователя будет доступен через `req.user`.

3. **Обработка ошибок**:
    - В случае неудачной аутентификации пользователи будут перенаправлены на `/auth/senler/error`.

4. **Отключение сессий**:
    - Опция `session: false` предотвращает сериализацию пользователя в сессии, её функционал бесполезен в данном контексте и включение будет приводить к ошибке

# Используйте senler-sdk
passport-senler не предоставляет API для работы с Senler. используйте в связке с **senler-sdk**

## Доступные типы TypeScript

Библиотека экспортирует следующие TypeScript типы:

### `SenlerStrategyOptions`
```typescript
interface SenlerStrategyOptions extends StrategyOptions {
  groupID?: string;        // ID группы Senler (опционально)
  clientSecret: string;    // Секретный ключ приложения
  callbackURL: string;     // URL для обратного вызова
}
```

### `SenlerChannel`
```typescript
interface SenlerChannel {
  accessToken: string;     // Токен доступа после успешной авторизации
  groupId?: string;        // ID группы Senler (если доступен)
}
```

### `SenlerAccessTokenResponse`
```typescript
interface SenlerAccessTokenResponse {
  access_token: string;    // Токен доступа
  token_type?: string;     // Тип токена (обычно "Bearer")
  expires_in?: number;     // Время жизни токена в секундах
  refresh_token?: string;  // Токен для обновления (если доступен)
}
```

### Импорт типов:
```typescript
import { 
  SenlerStrategy, 
  SenlerStrategyOptions, 
  SenlerChannel, 
  SenlerAccessTokenResponse 
} from 'passport-senler';
```

## Конфигурация

Необходимо заменить следующие значения на ваши:

- `clientID`: Получите его в панели разработчика **Senler**.
- `clientSecret`: Также доступен в настройках вашего приложения **Senler**.
- `callbackURL`: Это должен быть публичный URL, на который **Senler** перенаправит пользователей после аутентификации.
