"use strict";

import {
  addCartEntry,
  getCart,
  getFavorites,
  removeFavorite,
  updateCartEntry
} from "./api.js";
import {
  createProductCard,
  createStateMessage,
  getErrorMessage,
  renderAccountArea,
  setNavigationCounts,
  showNotice
} from "./shop-ui.js";

const favoritesList = document.querySelector("#favoritesList");
const status = document.querySelector("#favoritesStatus");

let favorites = [];
let cart = [];
let cartByProduct = new Map();

renderAccountArea();

function syncState() {
  cartByProduct = new Map(cart.map((entry) => [Number(entry.productId), entry]));
  setNavigationCounts(favorites, cart);
}

async function removeProductFromFavorites(product) {
  const favorite = favorites.find((entry) => Number(entry.productId) === Number(product.id));

  if (!favorite) {
    return false;
  }

  await removeFavorite(favorite.id);
  favorites = favorites.filter((entry) => entry.id !== favorite.id);
  syncState();
  renderFavorites();
  showNotice("Позиция удалена из избранного.");
  return false;
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
    syncState();
    showNotice("Количество товара в корзине увеличено.");
    return Number(updatedEntry.quantity);
  }

  const createdEntry = await addCartEntry(product.id, 1);
  cart.push(createdEntry);
  syncState();
  showNotice("Позиция добавлена в корзину.");
  return 1;
}

function renderFavorites() {
  const validFavorites = favorites.filter((entry) => entry.product);

  if (validFavorites.length === 0) {
    favoritesList.replaceChildren(createStateMessage({
      title: "В избранном пока пусто",
      description: "Добавьте интересующие товары и услуги на странице каталога.",
      actionText: "Перейти в каталог",
      href: "catalog.html"
    }));
    status.textContent = "Сохранённых позиций: 0.";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const favorite of validFavorites) {
    const product = favorite.product;
    const cartEntry = cartByProduct.get(Number(product.id));
    fragment.append(createProductCard(product, {
      favoriteActive: true,
      favoriteActionText: "Удалить из избранного",
      cartQuantity: Number(cartEntry?.quantity || 0),
      onFavorite: removeProductFromFavorites,
      onCart: addProductToCart
    }));
  }

  favoritesList.replaceChildren(fragment);
  status.textContent = `Сохранённых позиций: ${validFavorites.length}.`;
}

async function loadFavorites() {
  favoritesList.setAttribute("aria-busy", "true");
  status.textContent = "Загрузка данных с JSON Server…";

  if (favoritesList.childElementCount === 0) {
    favoritesList.replaceChildren(createStateMessage({
      title: "Загрузка избранного",
      description: "Получаем сохранённые позиции с локального сервера."
    }));
  }

  try {
    [favorites, cart] = await Promise.all([getFavorites(), getCart()]);
    syncState();
    renderFavorites();
  } catch (error) {
    status.textContent = "Избранное временно недоступно.";
    favoritesList.replaceChildren(createStateMessage({
      title: "Не удалось загрузить избранное",
      description: getErrorMessage(error),
      actionText: "Повторить запрос",
      onAction: loadFavorites
    }));
  } finally {
    favoritesList.setAttribute("aria-busy", "false");
  }
}

loadFavorites();
