"use strict";

import {
  addFeedback,
  getOrders,
  getProducts
} from "./api.js";
import {
  getCurrentUser,
  isAdmin
} from "./auth-store.js";
import {
  bindErrorReset,
  getField,
  setFieldError
} from "./form-utils.js";
import {
  createElement,
  getErrorMessage,
  renderAccountArea,
  showNotice
} from "./shop-ui.js";

const feedbackForm = document.querySelector("#feedbackForm");
const feedbackProduct = document.querySelector("#feedbackProduct");
const purchasedProducts = document.querySelector("#purchasedProducts");
const feedbackIntro = document.querySelector("#feedbackIntro");
const feedbackStatus = document.querySelector("#feedbackStatus");
const feedbackSubmit = document.querySelector("#feedbackSubmit");
const adminNavLink = document.querySelector("#adminNavLink");

let currentUser = getCurrentUser();
let products = [];
let purchased = [];

function setStatus(message, type = "") {
  feedbackStatus.textContent = message;
  feedbackStatus.className = `form-status${type ? ` form-${type}` : ""}`;
}

function validateFeedback() {
  const productId = getField(feedbackForm, "productId").value;
  const rating = getField(feedbackForm, "rating").value;
  const text = getField(feedbackForm, "text").value.trim();
  const errors = {};

  if (!productId || !purchased.some((product) => String(product.id) === productId)) {
    errors.productId = "Выберите позицию, которую вы приобретали.";
  }

  if (!rating) {
    errors.rating = "Выберите оценку от 1 до 5.";
  }

  if (text.length < 20) {
    errors.text = "Отзыв должен содержать не менее 20 символов.";
  }

  return errors;
}

function updateSubmitState() {
  feedbackSubmit.disabled = !currentUser
    || isAdmin(currentUser)
    || Object.keys(validateFeedback()).length > 0
    || !feedbackForm.checkValidity();
}

function renderPurchasedProducts() {
  purchasedProducts.replaceChildren();
  feedbackProduct.replaceChildren(new Option("Выберите приобретённую позицию", ""));

  for (const product of purchased) {
    const option = new Option(`${product.name} — ${product.category}`, String(product.id));
    feedbackProduct.append(option);

    const item = createElement("li", "", product.name);
    item.append(createElement("small", "", product.category));
    purchasedProducts.append(item);
  }

  if (purchased.length === 0) {
    purchasedProducts.append(createElement("li", "", "Покупок для отзыва пока нет."));
  }
}

async function submitFeedback(event) {
  event.preventDefault();
  const errors = validateFeedback();

  for (const name of ["productId", "rating", "text"]) {
    setFieldError(feedbackForm, name, errors[name] || "");
  }

  if (Object.keys(errors).length > 0 || !feedbackForm.checkValidity()) {
    setStatus("Исправьте ошибки в форме.", "alert");
    feedbackForm.reportValidity();
    return;
  }

  feedbackSubmit.disabled = true;

  try {
    await addFeedback({
      productId: Number(getField(feedbackForm, "productId").value),
      userId: Number(currentUser.id),
      text: getField(feedbackForm, "text").value.trim(),
      rating: Number(getField(feedbackForm, "rating").value),
      createdAt: new Date().toISOString()
    });
    feedbackForm.reset();
    setStatus("Отзыв отправлен на сервер.", "success");
    showNotice("Спасибо за отзыв.");
  } catch (error) {
    setStatus(getErrorMessage(error), "alert");
  } finally {
    updateSubmitState();
  }
}

async function initialize() {
  renderAccountArea();
  if (currentUser && isAdmin(currentUser)) {
    adminNavLink.hidden = false;
    feedbackIntro.textContent = "Пользователи с ролью администратора не могут оставлять отзывы.";
    feedbackForm.hidden = true;
    purchasedProducts.replaceChildren(createElement("li", "", "Для администратора отзывы недоступны."));
    return;
  }

  if (!currentUser) {
    feedbackIntro.textContent = "Войдите в профиль, чтобы оставить отзыв на приобретённую позицию.";
    feedbackForm.hidden = true;
    purchasedProducts.replaceChildren(createElement("li", "", "Сначала войдите или зарегистрируйтесь."));
    return;
  }

  try {
    const [productResponse, orderResponse] = await Promise.all([
      getProducts(),
      getOrders(new URLSearchParams({ userId: String(currentUser.id) }))
    ]);
    products = Array.isArray(productResponse.data) ? productResponse.data : [];
    const productIds = new Set((Array.isArray(orderResponse) ? orderResponse : []).map((order) => Number(order.productId)));
    purchased = products.filter((product) => productIds.has(Number(product.id)));
    renderPurchasedProducts();
    feedbackIntro.textContent = purchased.length
      ? "Выберите позицию из истории покупок и напишите отзыв."
      : "В истории покупок пока нет позиций, доступных для отзыва.";
    updateSubmitState();
  } catch (error) {
    setStatus(getErrorMessage(error), "alert");
    feedbackForm.hidden = true;
  }
}

bindErrorReset(feedbackForm, updateSubmitState);
feedbackForm.addEventListener("submit", submitFeedback);
initialize();
