# web_programming

Учебный лендинг компании СТР для лабораторных работ по веб-программированию.

## Макеты Figma

- [Основной файл STR Copy](https://www.figma.com/design/coMqGgZFQ9OLxnxnCxls7z/STR--Copy-?node-id=1260-2)
- [Исправленная мобильная версия, 320 px](https://www.figma.com/design/coMqGgZFQ9OLxnxnCxls7z/STR--Copy-?node-id=6265-2)
- [Исправленное мобильное меню, 320 px](https://www.figma.com/design/coMqGgZFQ9OLxnxnCxls7z/STR--Copy-?node-id=6265-314)
- [Планшетная версия, 768 px](https://www.figma.com/design/coMqGgZFQ9OLxnxnCxls7z/STR--Copy-?node-id=6319-2)
- [Планшетное меню, 768 px](https://www.figma.com/design/coMqGgZFQ9OLxnxnCxls7z/STR--Copy-?node-id=6393-2)

## Локальный запуск

Установить зависимость JSON Server:

```powershell
pnpm install
```

Запустить API в первом терминале:

```powershell
pnpm api
```

JSON Server будет доступен по адресу `http://localhost:3000/`.

Запустить статический сайт во втором терминале, например:

```powershell
python -m http.server 5500
```

После запуска главная страница доступна по адресу `http://localhost:5500/`, а каталог — по адресу `http://localhost:5500/catalog.html`.

## Лабораторная работа №8

Дополнительные страницы проекта:

```text
http://localhost:5500/account.html   — регистрация и авторизация
http://localhost:5500/feedback.html  — отзывы на приобретённые позиции
http://localhost:5500/admin.html     — панель администратора
```

Для учебной проверки в `db.json` добавлена административная запись с адресом `admin@str-techno.ru`. Пароль хранится в JSON Server только в виде SHA-256-хеша.

Учебный вход администратора: `admin@str-techno.ru` / `StrAdmin!2026`.

Новые коллекции JSON Server:

```text
users
feedback
orders
```

Оформление покупки в корзине требует входа в профиль, создаёт записи в `orders` и только после этого очищает `cart`. Оставить отзыв можно только на позицию, которая есть в истории заказов текущего пользователя.
