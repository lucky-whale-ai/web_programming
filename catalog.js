"use strict";

import {
  addCartEntry,
  addFavorite,
  getAllProducts,
  getCart,
  getFavorites,
  getProducts,
  removeFavorite,
  updateCartEntry
} from "./api.js";
import {
  createElement,
  createProductCard,
  createStateMessage,
  getErrorMessage,
  renderAccountArea,
  setNavigationCounts,
  showNotice
} from "./shop-ui.js";

const PAGE_LIMIT = 6;
const SEARCH_DELAY = 350;

const state = {
  search: "",
  sort: "default",
  categories: new Set(),
  type: "all",
  featured: false,
  minPrice: "",
  maxPrice: "",
  minRating: "",
  page: 1,
  total: 0
};

const catalog = document.querySelector("#catalog");
const status = document.querySelector("#catalogStatus");
const searchInput = document.querySelector("#catalogSearch");
const sortSelect = document.querySelector("#catalogSort");
const categoryFilters = document.querySelector("#categoryFilters");
const typeSelect = document.querySelector("#catalogType");
const featuredInput = document.querySelector("#catalogFeatured");
const minPriceInput = document.querySelector("#catalogMinPrice");
const maxPriceInput = document.querySelector("#catalogMaxPrice");
const minRatingSelect = document.querySelector("#catalogMinRating");
const resetButton = document.querySelector("#catalogReset");
const pagination = document.querySelector("#catalogPagination");

renderAccountArea();

let favorites = [];
let cart = [];
let favoritesByProduct = new Map();
let cartByProduct = new Map();
let requestController = null;
let searchTimer = null;
let numericFilterTimer = null;

function mapEntriesByProduct(entries) {
  return new Map(entries.map((entry) => [Number(entry.productId), entry]));
}

function syncRelatedState(nextFavorites = favorites, nextCart = cart) {
  favorites = nextFavorites;
  cart = nextCart;
  favoritesByProduct = mapEntriesByProduct(favorites);
  cartByProduct = mapEntriesByProduct(cart);
  setNavigationCounts(favorites, cart);
}

function buildProductQuery() {
  const params = new URLSearchParams();
  const normalizedSearch = state.search.trim();

  if (normalizedSearch) {
    params.set("q", normalizedSearch);
  }

  const sortParameters = {
    "price-asc": ["price", "asc"],
    "price-desc": ["price", "desc"],
    "name-asc": ["name", "asc"],
    "rating-desc": ["rating", "desc"]
  };
  const selectedSort = sortParameters[state.sort];

  if (selectedSort) {
    params.set("_sort", selectedSort[0]);
    params.set("_order", selectedSort[1]);
  }

  for (const category of state.categories) {
    params.append("category", category);
  }

  if (state.type !== "all") {
    params.set("type", state.type);
  }

  if (state.featured) {
    params.set("featured", "true");
  }

  if (state.minPrice !== "") {
    params.set("price_gte", state.minPrice);
  }

  if (state.maxPrice !== "") {
    params.set("price_lte", state.maxPrice);
  }

  if (state.minRating !== "") {
    params.set("rating_gte", state.minRating);
  }

  params.set("_page", String(state.page));
  params.set("_limit", String(PAGE_LIMIT));
  return params;
}

function createPaginationButton(label, page, options = {}) {
  const button = createElement("button", "catalog-pagination__button", label);
  button.type = "button";
  button.disabled = Boolean(options.disabled);

  if (options.current) {
    button.classList.add("is-current");
    button.setAttribute("aria-current", "page");
  }

  button.addEventListener("click", () => {
    if (page === state.page || button.disabled) {
      return;
    }

    state.page = page;
    loadCatalog({ scrollToResults: true });
  });

  return button;
}

function renderPagination() {
  const pageCount = Math.max(1, Math.ceil(state.total / PAGE_LIMIT));
  const fragment = document.createDocumentFragment();
  fragment.append(createPaginationButton("Назад", Math.max(1, state.page - 1), {
    disabled: state.page === 1
  }));

  for (let page = 1; page <= pageCount; page += 1) {
    fragment.append(createPaginationButton(String(page), page, {
      current: page === state.page
    }));
  }

  fragment.append(createPaginationButton("Вперёд", Math.min(pageCount, state.page + 1), {
    disabled: state.page === pageCount
  }));
  pagination.replaceChildren(fragment);
  pagination.hidden = state.total === 0;
}

async function toggleFavorite(product) {
  const existingFavorite = favoritesByProduct.get(Number(product.id));

  if (existingFavorite) {
    await removeFavorite(existingFavorite.id);
    syncRelatedState(
      favorites.filter((entry) => entry.id !== existingFavorite.id),
      cart
    );
    showNotice("Позиция удалена из избранного.");
    return false;
  }

  const createdFavorite = await addFavorite(product.id);
  syncRelatedState([...favorites, createdFavorite], cart);
  showNotice("Позиция добавлена в избранное.");
  return true;
}

async function addProductToCart(product) {
  const existingEntry = cartByProduct.get(Number(product.id));

  if (existingEntry) {
    const updatedEntry = await updateCartEntry(existingEntry.id, Number(existingEntry.quantity) + 1);
    cart = cart.map((entry) => (
      entry.id === existingEntry.id
        ? { ...entry, ...updatedEntry, product: entry.product }
        : entry
    ));
    syncRelatedState(favorites, cart);
    showNotice("Количество товара в корзине увеличено.");
    return Number(updatedEntry.quantity);
  }

  const createdEntry = await addCartEntry(product.id, 1);
  syncRelatedState(favorites, [...cart, createdEntry]);
  showNotice("Позиция добавлена в корзину.");
  return 1;
}

function renderProducts(products) {
  if (products.length === 0) {
    catalog.replaceChildren(createStateMessage({
      title: "Ничего не найдено",
      description: "Измените поисковый запрос, категории или числовые диапазоны.",
      actionText: "Сбросить параметры",
      onAction: resetCatalog
    }));
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const product of products) {
    const favorite = favoritesByProduct.get(Number(product.id));
    const cartEntry = cartByProduct.get(Number(product.id));
    fragment.append(createProductCard(product, {
      favoriteActive: Boolean(favorite),
      cartQuantity: Number(cartEntry?.quantity || 0),
      onFavorite: toggleFavorite,
      onCart: addProductToCart
    }));
  }

  catalog.replaceChildren(fragment);
}

async function loadCatalog(options = {}) {
  requestController?.abort();
  requestController = new AbortController();
  catalog.setAttribute("aria-busy", "true");
  status.textContent = "Загрузка данных с JSON Server…";

  if (catalog.childElementCount === 0) {
    catalog.replaceChildren(createStateMessage({
      title: "Загрузка каталога",
      description: "Получаем актуальные данные с локального сервера."
    }));
  }

  try {
    const response = await getProducts(buildProductQuery(), {
      signal: requestController.signal
    });
    const products = Array.isArray(response.data) ? response.data : [];
    state.total = response.total ?? products.length;
    const pageCount = Math.max(1, Math.ceil(state.total / PAGE_LIMIT));

    if (state.page > pageCount) {
      state.page = pageCount;
      await loadCatalog(options);
      return;
    }

    renderProducts(products);
    renderPagination();
    const firstResult = state.total === 0 ? 0 : (state.page - 1) * PAGE_LIMIT + 1;
    const lastResult = Math.min(state.page * PAGE_LIMIT, state.total);
    status.textContent = state.total === 0
      ? "По заданным параметрам позиций не найдено."
      : `Показано ${firstResult}–${lastResult} из ${state.total}. Страница ${state.page} из ${pageCount}.`;

    if (options.scrollToResults) {
      document.querySelector(".catalog-results-heading")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    state.total = 0;
    pagination.hidden = true;
    status.textContent = "Каталог временно недоступен.";
    catalog.replaceChildren(createStateMessage({
      title: "Не удалось загрузить каталог",
      description: getErrorMessage(error),
      actionText: "Повторить запрос",
      onAction: loadCatalog
    }));
  } finally {
    catalog.setAttribute("aria-busy", "false");
  }
}

function renderCategoryFilters(products) {
  const categories = new Set(products.map((product) => product.category));
  const fragment = document.createDocumentFragment();
  let categoryIndex = 0;

  for (const category of categories) {
    const label = createElement("label", "catalog-category");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category;
    checkbox.id = `category-${categoryIndex}`;
    label.htmlFor = checkbox.id;
    label.append(checkbox, createElement("span", "", category));
    fragment.append(label);
    categoryIndex += 1;
  }

  categoryFilters.replaceChildren(fragment);
}

function resetCatalog() {
  window.clearTimeout(searchTimer);
  window.clearTimeout(numericFilterTimer);
  state.search = "";
  state.sort = "default";
  state.categories.clear();
  state.type = "all";
  state.featured = false;
  state.minPrice = "";
  state.maxPrice = "";
  state.minRating = "";
  state.page = 1;

  searchInput.value = "";
  sortSelect.value = "default";
  typeSelect.value = "all";
  featuredInput.checked = false;
  minPriceInput.value = "";
  maxPriceInput.value = "";
  minRatingSelect.value = "";

  for (const checkbox of categoryFilters.querySelectorAll("input[type='checkbox']")) {
    checkbox.checked = false;
  }

  loadCatalog();
}

function requestFromFirstPage() {
  state.page = 1;
  loadCatalog();
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  state.page = 1;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadCatalog, SEARCH_DELAY);
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  requestFromFirstPage();
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

  requestFromFirstPage();
});

typeSelect.addEventListener("change", () => {
  state.type = typeSelect.value;
  requestFromFirstPage();
});

featuredInput.addEventListener("change", () => {
  state.featured = featuredInput.checked;
  requestFromFirstPage();
});

function scheduleNumericFilter() {
  state.minPrice = minPriceInput.value;
  state.maxPrice = maxPriceInput.value;
  state.page = 1;
  window.clearTimeout(numericFilterTimer);
  numericFilterTimer = window.setTimeout(loadCatalog, 250);
}

minPriceInput.addEventListener("input", scheduleNumericFilter);
maxPriceInput.addEventListener("input", scheduleNumericFilter);

minRatingSelect.addEventListener("change", () => {
  state.minRating = minRatingSelect.value;
  requestFromFirstPage();
});

resetButton.addEventListener("click", resetCatalog);

async function initializeCatalog() {
  catalog.setAttribute("aria-busy", "true");

  try {
    const [products, favoriteEntries, cartEntries] = await Promise.all([
      getAllProducts(),
      getFavorites(),
      getCart()
    ]);
    renderCategoryFilters(products);
    syncRelatedState(favoriteEntries, cartEntries);
    await loadCatalog();
  } catch (error) {
    status.textContent = "Каталог временно недоступен.";
    catalog.replaceChildren(createStateMessage({
      title: "JSON Server недоступен",
      description: getErrorMessage(error),
      actionText: "Повторить подключение",
      onAction: initializeCatalog
    }));
  } finally {
    catalog.setAttribute("aria-busy", "false");
  }
}

initializeCatalog();
