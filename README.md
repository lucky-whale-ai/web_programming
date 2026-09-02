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
