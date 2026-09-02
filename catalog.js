"use strict";

const catalogItems = Object.freeze([
  {
    id: 1,
    name: "Шинопровод СТР 160А",
    category: "Шинопроводы",
    type: "Товар",
    price: 2450,
    rating: 4.7,
    description: "Компактная секция для распределения электроэнергии на производственных и коммерческих объектах.",
    image: "assets/images/busbar-assembly.png",
    featured: true
  },
  {
    id: 2,
    name: "Шинопровод СТР 250А",
    category: "Шинопроводы",
    type: "Товар",
    price: 3180,
    rating: 4.8,
    description: "Система со сниженной металлоёмкостью и улучшенным теплоотводом для распределительных сетей.",
    image: "assets/images/hero-busbars.png",
    featured: false
  },
  {
    id: 3,
    name: "Шинопровод СТР 400А",
    category: "Шинопроводы",
    type: "Товар",
    price: 4650,
    rating: 4.9,
    description: "Модульное решение с усиленной изоляцией для подключения промышленного оборудования.",
    image: "assets/images/hero-connector.png",
    featured: true
  },
  {
    id: 4,
    name: "Шинопровод СТР 630А",
    category: "Шинопроводы",
    type: "Товар",
    price: 6900,
    rating: 5,
    description: "Высокомощная линия для ответственных объектов с повышенными требованиями к надёжности.",
    image: "assets/images/news-busbar.png",
    featured: true
  },
  {
    id: 5,
    name: "Комплект соединительных секций",
    category: "Шинопроводы",
    type: "Товар",
    price: 1280,
    rating: 4.6,
    description: "Набор прямых и угловых соединений для адаптации трассы шинопровода к геометрии объекта.",
    image: "assets/images/hero-busbars-tablet.png",
    featured: false
  },
  {
    id: 6,
    name: "Технический аудит энергосистемы",
    category: "Инжиниринг R&D",
    type: "Услуга",
    price: 1900,
    rating: 4.9,
    description: "Обследование электрической инфраструктуры, выявление рисков и подготовка технических рекомендаций.",
    image: "assets/images/consulting-research.png",
    featured: true
  },
  {
    id: 7,
    name: "Проектирование шинопроводной трассы",
    category: "Инжиниринг R&D",
    type: "Услуга",
    price: 2700,
    rating: 5,
    description: "Разработка компоновки, расчёт нагрузок и выпуск комплекта проектной документации.",
    image: "assets/images/consulting-drawing.png",
    featured: true
  },
  {
    id: 8,
    name: "Лабораторные испытания оборудования",
    category: "Инжиниринг R&D",
    type: "Услуга",
    price: 3400,
    rating: 4.8,
    description: "Проверка нагрева, механической прочности и устойчивости оборудования к рабочим нагрузкам.",
    image: "assets/images/news-consulting.png",
    featured: false
  },
  {
    id: 9,
    name: "Исследование отраслевого рынка",
    category: "Инжиниринг R&D",
    type: "Услуга",
    price: 2200,
    rating: 4.7,
    description: "Анализ производителей, технических решений, ценовых сегментов и перспектив развития рынка.",
    image: "assets/images/consulting-market.png",
    featured: false
  },
  {
    id: 10,
    name: "Экспертиза технической документации",
    category: "Инжиниринг R&D",
    type: "Услуга",
    price: 1650,
    rating: 4.9,
    description: "Проверка расчётов, чертежей и отчётных материалов на соответствие техническому заданию.",
    image: "assets/images/consulting-documents.png",
    featured: true
  },
  {
    id: 11,
    name: "Подбор инженера-электрика",
    category: "Технический рекрутинг",
    type: "Услуга",
    price: 1450,
    rating: 4.8,
    description: "Поиск и первичная оценка специалиста с опытом эксплуатации промышленного электрооборудования.",
    image: "assets/images/worker-portrait.png",
    featured: true
  },
  {
    id: 12,
    name: "Формирование проектной команды",
    category: "Технический рекрутинг",
    type: "Услуга",
    price: 3900,
    rating: 4.9,
    description: "Комплексный подбор инженеров и руководителей для запуска нового промышленного проекта.",
    image: "assets/images/recruiting-background.png",
    featured: true
  },
  {
    id: 13,
    name: "Оценка инженерных компетенций",
    category: "Технический рекрутинг",
    type: "Услуга",
    price: 980,
    rating: 4.6,
    description: "Техническое интервью, проверка практических навыков и подготовка заключения по кандидату.",
    image: "assets/images/hero-worker.png",
    featured: false
  },
  {
    id: 14,
    name: "Шеф-монтаж и ввод в эксплуатацию",
    category: "Инженерный консалтинг",
    type: "Услуга",
    price: 5200,
    rating: 5,
    description: "Контроль монтажа, пусконаладочные работы и сопровождение запуска оборудования на объекте.",
    image: "assets/images/hero-power-plant.png",
    featured: true
  },
  {
    id: 15,
    name: "Модернизация системы электроснабжения",
    category: "Инженерный консалтинг",
    type: "Услуга",
    price: 7600,
    rating: 4.9,
    description: "Разработка и сопровождение комплекса мероприятий по повышению надёжности энергоснабжения.",
    image: "assets/images/project-foundry.png",
    featured: true
  }
]);

const operationLabels = Object.freeze({
  all: "Исходный массив",
  map: "map() — скидка 10%",
  filter: "filter() — рейтинг от 4,8",
  reduce: "reduce() — минимальная цена",
  sort: "sort() — цена по возрастанию",
  find: "find() — первый рейтинг 5,0",
  slice: "slice() — первые пять",
  splice: "splice() — средняя пятёрка",
  reverse: "reverse() — обратный порядок",
  concat: "concat() — продукты и R&D",
  forEach: "forEach() — рекомендуемые"
});

const state = {
  operation: "all",
  search: "",
  sort: "default",
  categories: new Set()
};

const catalog = document.querySelector("#catalog");
const status = document.querySelector("#catalogStatus");
const searchInput = document.querySelector("#catalogSearch");
const sortSelect = document.querySelector("#catalogSort");
const categoryFilters = document.querySelector("#categoryFilters");
const resetButton = document.querySelector("#catalogReset");
const operationButtons = document.querySelectorAll("[data-operation]");

const currencyFormatter = new Intl.NumberFormat("ru-BY", {
  style: "currency",
  currency: "BYN",
  maximumFractionDigits: 0
});

const operationHandlers = {
  all() {
    return [...catalogItems];
  },

  map() {
    return catalogItems.map((item) => ({
      ...item,
      originalPrice: item.price,
      price: Math.round(item.price * 0.9),
      badge: "Скидка 10%"
    }));
  },

  filter() {
    return catalogItems.filter((item) => item.rating >= 4.8);
  },

  reduce() {
    const cheapestItem = catalogItems.reduce((cheapest, item) => (
      item.price < cheapest.price ? item : cheapest
    ));
    return [{ ...cheapestItem, badge: "Минимальная цена" }];
  },

  sort() {
    return [...catalogItems].sort((first, second) => first.price - second.price);
  },

  find() {
    const foundItem = catalogItems.find((item) => item.rating === 5);
    return foundItem ? [{ ...foundItem, badge: "Первый результат" }] : [];
  },

  slice() {
    return catalogItems.slice(0, 5);
  },

  splice() {
    const catalogCopy = [...catalogItems];
    return catalogCopy.splice(5, 5);
  },

  reverse() {
    return [...catalogItems].reverse();
  },

  concat() {
    const products = [];
    const researchServices = [];

    for (const item of catalogItems) {
      if (item.category === "Шинопроводы") {
        products.push(item);
      }

      if (item.category === "Инжиниринг R&D") {
        researchServices.push(item);
      }
    }

    return products.concat(researchServices);
  },

  forEach() {
    const featuredItems = [];

    catalogItems.forEach((item) => {
      if (item.featured) {
        featuredItems.push(item);
      }
    });

    return featuredItems;
  }
};

function normalizeText(value) {
  return value.toLocaleLowerCase("ru").trim();
}

function applySearch(items) {
  const query = normalizeText(state.search);

  if (!query) {
    return items;
  }

  return items.filter((item) => (
    normalizeText(item.name).includes(query)
    || normalizeText(item.description).includes(query)
  ));
}

function applyCategoryFilter(items) {
  if (state.categories.size === 0) {
    return items;
  }

  return items.filter((item) => state.categories.has(item.category));
}

function applySort(items) {
  const sortedItems = [...items];

  switch (state.sort) {
    case "price-asc":
      return sortedItems.sort((first, second) => first.price - second.price);
    case "price-desc":
      return sortedItems.sort((first, second) => second.price - first.price);
    case "name-asc":
      return sortedItems.sort((first, second) => first.name.localeCompare(second.name, "ru"));
    case "rating-desc":
      return sortedItems.sort((first, second) => second.rating - first.rating);
    default:
      return sortedItems;
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createCatalogCard(item) {
  const card = createElement("article", "catalog-card");
  card.dataset.id = String(item.id);

  const imageWrap = createElement("div", "catalog-card__image-wrap");
  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.name;
  image.loading = "lazy";
  image.decoding = "async";
  imageWrap.append(image);

  if (item.badge) {
    imageWrap.append(createElement("span", "catalog-card__badge", item.badge));
  }

  const content = createElement("div", "catalog-card__content");
  const meta = createElement("div", "catalog-card__meta");
  meta.append(
    createElement("span", "", item.category),
    createElement("span", "", item.type)
  );

  const title = createElement("h3", "", item.name);
  const description = createElement("p", "catalog-card__description", item.description);

  const footer = createElement("div", "catalog-card__footer");
  const price = createElement("div", "catalog-card__price");
  const formattedPrice = currencyFormatter.format(item.price);
  const pricePrefix = item.type === "Услуга" ? "от " : "";
  price.append(createElement("strong", "", `${pricePrefix}${formattedPrice}`));

  if (item.originalPrice) {
    price.append(createElement("del", "", currencyFormatter.format(item.originalPrice)));
  }

  const rating = createElement("span", "catalog-card__rating", `★ ${item.rating.toFixed(1)}`);
  rating.setAttribute("aria-label", `Рейтинг ${item.rating.toFixed(1)} из 5`);

  footer.append(price, rating);
  content.append(meta, title, description, footer);
  card.append(imageWrap, content);

  return card;
}

function resetCatalog() {
  state.operation = "all";
  state.search = "";
  state.sort = "default";
  state.categories.clear();

  searchInput.value = "";
  sortSelect.value = "default";

  for (const button of operationButtons) {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  }

  for (const checkbox of categoryFilters.querySelectorAll("input[type='checkbox']")) {
    checkbox.checked = false;
  }

  renderCatalog();
}

function createEmptyState() {
  const emptyState = createElement("section", "catalog-empty");
  const content = createElement("div", "catalog-empty__content");
  const title = createElement("h3", "", "Ничего не найдено");
  const description = createElement(
    "p",
    "",
    "Измените поисковый запрос, выберите другую категорию или сбросьте параметры каталога."
  );
  const button = createElement("button", "catalog-reset", "Сбросить параметры");
  button.type = "button";
  button.addEventListener("click", () => {
    resetCatalog();
    searchInput.focus();
  });

  content.append(title, description, button);
  emptyState.append(content);
  return emptyState;
}

function renderCatalog() {
  const operationItems = operationHandlers[state.operation]();
  const searchedItems = applySearch(operationItems);
  const categoryItems = applyCategoryFilter(searchedItems);
  const visibleItems = applySort(categoryItems);
  const fragment = document.createDocumentFragment();

  if (visibleItems.length === 0) {
    fragment.append(createEmptyState());
  } else {
    for (const item of visibleItems) {
      fragment.append(createCatalogCard(item));
    }
  }

  catalog.replaceChildren(fragment);
  status.textContent = `Показано: ${visibleItems.length} из ${operationItems.length}. ${operationLabels[state.operation]}.`;
}

function renderCategoryFilters() {
  const categories = new Set();

  for (const item of catalogItems) {
    categories.add(item.category);
  }

  const fragment = document.createDocumentFragment();
  let categoryIndex = 0;

  for (const category of categories) {
    const label = createElement("label", "catalog-category");
    const checkbox = document.createElement("input");
    const labelText = createElement("span", "", category);
    checkbox.type = "checkbox";
    checkbox.value = category;
    checkbox.id = `category-${categoryIndex}`;
    label.htmlFor = checkbox.id;
    label.append(checkbox, labelText);
    fragment.append(label);
    categoryIndex += 1;
  }

  categoryFilters.replaceChildren(fragment);
}

for (const button of operationButtons) {
  button.addEventListener("click", () => {
    state.operation = button.dataset.operation;

    for (const operationButton of operationButtons) {
      const isActive = operationButton === button;
      operationButton.classList.toggle("is-active", isActive);
      operationButton.setAttribute("aria-pressed", String(isActive));
    }

    renderCatalog();
  });
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderCatalog();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderCatalog();
});

categoryFilters.addEventListener("change", (event) => {
  const checkbox = event.target;

  if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== "checkbox") {
    return;
  }

  if (checkbox.checked) {
    state.categories.add(checkbox.value);
  } else {
    state.categories.delete(checkbox.value);
  }

  renderCatalog();
});

resetButton.addEventListener("click", resetCatalog);

renderCategoryFilters();
renderCatalog();
