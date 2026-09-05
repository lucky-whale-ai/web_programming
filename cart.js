"use strict";

import {
  addOrder,
  getCart,
  getFavorites,
  removeOrder,
  removeCartEntry,
  updateCartEntry
} from "./api.js";
import { getCurrentUser } from "./auth-store.js";
import {
  createElement,
  createStateMessage,
  currencyFormatter,
  getErrorMessage,
  renderAccountArea,
  setNavigationCounts,
  showNotice
} from "./shop-ui.js";

const cartList = document.querySelector("#cartList");
const status = document.querySelector("#cartStatus");
const totalQuantity = document.querySelector("#cartTotalQuantity");
const totalPrice = document.querySelector("#cartTotalPrice");
const checkoutButton = document.querySelector("#cartCheckout");

let favorites = [];
let cart = [];

renderAccountArea();

function getValidCart() {
  return cart.filter((entry) => entry.product);
}

function renderSummary() {
  const validCart = getValidCart();
  const quantity = validCart.reduce((sum, entry) => sum + Number(entry.quantity), 0);
  const price = validCart.reduce((sum, entry) => (
    sum + Number(entry.quantity) * Number(entry.product.price)
  ), 0);

  totalQuantity.textContent = String(quantity);
  totalPrice.textContent = currencyFormatter.format(price);
  checkoutButton.disabled = validCart.length === 0;
  setNavigationCounts(favorites, cart);
}

async function saveQuantity(entry, nextQuantity, controls) {
  const safeQuantity = Math.min(99, Math.max(1, Number(nextQuantity) || 1));

  for (const control of controls.querySelectorAll("button, input")) {
    control.disabled = true;
  }

  try {
    const updatedEntry = await updateCartEntry(entry.id, safeQuantity);
    entry.quantity = Number(updatedEntry.quantity);
    renderCart();
    showNotice("Количество в корзине обновлено.");
  } catch (error) {
    showNotice(getErrorMessage(error), "error");
    renderCart();
  }
}

async function deleteEntry(entry) {
  await removeCartEntry(entry.id);
  cart = cart.filter((cartEntry) => cartEntry.id !== entry.id);
  renderCart();
  showNotice("Позиция удалена из корзины.");
}

function createCartItem(entry) {
  const product = entry.product;
  const item = createElement("article", "cart-item");
  item.dataset.id = String(entry.id);

  const image = document.createElement("img");
  image.className = "cart-item__image";
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";
  image.decoding = "async";

  const content = createElement("div", "cart-item__content");
  const category = createElement("p", "cart-item__category", product.category);
  const title = createElement("h3", "", product.name);
  const pricePrefix = product.type === "Услуга" ? "от " : "";
  const price = createElement(
    "p",
    "cart-item__price",
    `${pricePrefix}${currencyFormatter.format(product.price)} за позицию`
  );
  content.append(category, title, price);

  const controls = createElement("div", "cart-item__controls");
  const quantityControl = createElement("div", "cart-quantity");
  const decreaseButton = createElement("button", "", "−");
  decreaseButton.type = "button";
  decreaseButton.setAttribute("aria-label", `Уменьшить количество: ${product.name}`);
  decreaseButton.disabled = Number(entry.quantity) <= 1;

  const quantityInput = document.createElement("input");
  quantityInput.type = "number";
  quantityInput.min = "1";
  quantityInput.max = "99";
  quantityInput.value = String(entry.quantity);
  quantityInput.inputMode = "numeric";
  quantityInput.setAttribute("aria-label", `Количество: ${product.name}`);

  const increaseButton = createElement("button", "", "+");
  increaseButton.type = "button";
  increaseButton.setAttribute("aria-label", `Увеличить количество: ${product.name}`);
  quantityControl.append(decreaseButton, quantityInput, increaseButton);

  const subtotal = createElement(
    "p",
    "cart-item__subtotal",
    currencyFormatter.format(Number(product.price) * Number(entry.quantity))
  );
  const removeButton = createElement("button", "cart-item__remove", "Удалить");
  removeButton.type = "button";

  decreaseButton.addEventListener("click", () => {
    saveQuantity(entry, Number(entry.quantity) - 1, quantityControl);
  });
  increaseButton.addEventListener("click", () => {
    saveQuantity(entry, Number(entry.quantity) + 1, quantityControl);
  });
  quantityInput.addEventListener("change", () => {
    saveQuantity(entry, quantityInput.value, quantityControl);
  });
  removeButton.addEventListener("click", async () => {
    removeButton.disabled = true;

    try {
      await deleteEntry(entry);
    } catch (error) {
      removeButton.disabled = false;
      showNotice(getErrorMessage(error), "error");
    }
  });

  controls.append(quantityControl, subtotal, removeButton);
  item.append(image, content, controls);
  return item;
}

function renderCart() {
  const validCart = getValidCart();

  if (validCart.length === 0) {
    cartList.replaceChildren(createStateMessage({
      title: "Корзина пуста",
      description: "Добавьте товары или услуги из каталога, чтобы оформить учебную покупку.",
      actionText: "Перейти в каталог",
      href: "catalog.html"
    }));
    status.textContent = "Позиций в корзине: 0.";
    renderSummary();
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const entry of validCart) {
    fragment.append(createCartItem(entry));
  }

  cartList.replaceChildren(fragment);
  status.textContent = `Позиций в корзине: ${validCart.length}.`;
  renderSummary();
}

async function checkout() {
  const validCart = getValidCart();

  if (validCart.length === 0) {
    return;
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "account.html?return=cart.html";
    return;
  }

  checkoutButton.disabled = true;
  const checkoutId = window.crypto.randomUUID?.() || `checkout-${Date.now()}`;
  const createdOrders = [];

  try {
    for (const entry of validCart) {
      const order = await addOrder({
        checkoutId,
        userId: Number(currentUser.id),
        productId: Number(entry.product.id),
        productName: entry.product.name,
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.product.price),
        purchasedAt: new Date().toISOString()
      });
      createdOrders.push(order);
    }

    await Promise.all(validCart.map((entry) => removeCartEntry(entry.id)));
    cart = [];
    renderCart();
    showNotice("Покупка успешно оформлена. Корзина очищена.");
  } catch (error) {
    await Promise.allSettled(createdOrders.map((order) => removeOrder(order.id)));
    showNotice(getErrorMessage(error), "error");
    await loadCart();
  }
}

async function loadCart() {
  cartList.setAttribute("aria-busy", "true");
  status.textContent = "Загрузка данных с JSON Server…";

  if (cartList.childElementCount === 0) {
    cartList.replaceChildren(createStateMessage({
      title: "Загрузка корзины",
      description: "Получаем актуальный состав с локального сервера."
    }));
  }

  try {
    [favorites, cart] = await Promise.all([getFavorites(), getCart()]);
    renderCart();
  } catch (error) {
    status.textContent = "Корзина временно недоступна.";
    cartList.replaceChildren(createStateMessage({
      title: "Не удалось загрузить корзину",
      description: getErrorMessage(error),
      actionText: "Повторить запрос",
      onAction: loadCart
    }));
    checkoutButton.disabled = true;
  } finally {
    cartList.setAttribute("aria-busy", "false");
  }
}

checkoutButton.addEventListener("click", checkout);
loadCart();
