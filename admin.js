"use strict";

import {
  addProduct,
  getFeedback,
  getProducts,
  getUsers,
  removeFeedback,
  removeProduct,
  updateProduct
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
  currencyFormatter,
  getErrorMessage,
  renderAccountArea,
  showNotice
} from "./shop-ui.js";

const adminContent = document.querySelector("#adminContent");
const accessDenied = document.querySelector("#accessDenied");
const productForm = document.querySelector("#productForm");
const productFormTitle = document.querySelector("#productFormTitle");
const productSubmit = document.querySelector("#productSubmit");
const productCancel = document.querySelector("#productCancel");
const productStatus = document.querySelector("#productStatus");
const productList = document.querySelector("#adminProductList");
const productFilter = document.querySelector("#feedbackProductFilter");
const userFilter = document.querySelector("#feedbackUserFilter");
const feedbackAdminStatus = document.querySelector("#feedbackAdminStatus");
const feedbackTableBody = document.querySelector("#feedbackTableBody");
const adminNavLink = document.querySelector("#adminNavLink");

let products = [];
let users = [];
let feedback = [];

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `form-status${type ? ` form-${type}` : ""}`;
}

function collectProduct() {
  return {
    name: getField(productForm, "name").value.trim(),
    category: getField(productForm, "category").value.trim(),
    type: getField(productForm, "type").value,
    price: Number(getField(productForm, "price").value),
    rating: Number(getField(productForm, "rating").value),
    description: getField(productForm, "description").value.trim(),
    image: getField(productForm, "image").value.trim(),
    featured: getField(productForm, "featured").checked
  };
}

function validateProduct() {
  const product = collectProduct();
  const errors = {};

  if (product.name.length < 3) {
    errors.name = "Название должно содержать не менее 3 символов.";
  }
  if (product.category.length < 3) {
    errors.category = "Укажите категорию.";
  }
  if (!product.type) {
    errors.type = "Выберите тип позиции.";
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    errors.price = "Цена не может быть отрицательной.";
  }
  if (!Number.isFinite(product.rating) || product.rating < 0 || product.rating > 5) {
    errors.rating = "Рейтинг должен быть от 0 до 5.";
  }
  if (!product.image) {
    errors.image = "Укажите путь к изображению.";
  }
  if (product.description.length < 20) {
    errors.description = "Описание должно содержать не менее 20 символов.";
  }

  return errors;
}

function updateProductSubmitState() {
  productSubmit.disabled = Object.keys(validateProduct()).length > 0 || !productForm.checkValidity();
}

function renderProducts() {
  productList.replaceChildren();

  for (const product of products) {
    const item = createElement("li", "admin-list-item");
    const top = createElement("div", "admin-list-item__top");
    const title = createElement("h3", "", product.name);
    const meta = createElement("span", "admin-list-item__meta", `#${product.id} · ${product.type}`);
    top.append(title, meta);
    const details = createElement(
      "p",
      "",
      `${product.category} · ${currencyFormatter.format(product.price)} · рейтинг ${Number(product.rating).toFixed(1)}`
    );
    const actions = createElement("div", "admin-list-item__actions");
    const editButton = createElement("button", "form-button-secondary", "Редактировать");
    editButton.type = "button";
    editButton.addEventListener("click", () => startEditing(product));
    const deleteButton = createElement("button", "form-button-danger", "Удалить");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteProduct(product));
    actions.append(editButton, deleteButton);
    item.append(top, details, actions);
    productList.append(item);
  }

  if (products.length === 0) {
    productList.append(createElement("li", "admin-empty", "Каталог пуст."));
  }
}

function renderSelectOptions() {
  productFilter.replaceChildren(new Option("Все товары и услуги", "all"));
  userFilter.replaceChildren(new Option("Все пользователи", "all"));

  for (const product of products) {
    productFilter.append(new Option(product.name, String(product.id)));
  }

  for (const user of users) {
    userFilter.append(new Option(`${user.nickname || user.email} (#${user.id})`, String(user.id)));
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ru-RU");
}

function renderFeedback() {
  const selectedProduct = productFilter.value;
  const selectedUser = userFilter.value;
  const productById = new Map(products.map((product) => [Number(product.id), product]));
  const userById = new Map(users.map((user) => [Number(user.id), user]));
  const visible = feedback.filter((item) => (
    (selectedProduct === "all" || Number(item.productId) === Number(selectedProduct))
    && (selectedUser === "all" || Number(item.userId) === Number(selectedUser))
  ));

  feedbackTableBody.replaceChildren();
  setStatus(feedbackAdminStatus, `Показано отзывов: ${visible.length}.`);

  for (const item of visible) {
    const row = document.createElement("tr");
    const user = userById.get(Number(item.userId));
    const product = productById.get(Number(item.productId));
    const values = [
      user?.nickname || user?.email || `Пользователь #${item.userId}`,
      product?.name || `Позиция #${item.productId}`,
      `${Number(item.rating || 0).toFixed(1)} / 5`,
      item.text,
      formatDate(item.createdAt)
    ];

    for (const value of values) {
      row.append(createElement("td", "", value));
    }

    const actionCell = document.createElement("td");
    const deleteButton = createElement("button", "form-button-danger", "Удалить");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteFeedback(item));
    actionCell.append(deleteButton);
    row.append(actionCell);
    feedbackTableBody.append(row);
  }

  if (visible.length === 0) {
    const row = document.createElement("tr");
    const cell = createElement("td", "admin-empty", "Отзывы по выбранным параметрам не найдены.");
    cell.colSpan = 6;
    row.append(cell);
    feedbackTableBody.append(row);
  }
}

function resetProductForm() {
  productForm.reset();
  getField(productForm, "productId").value = "";
  productFormTitle.textContent = "Добавить товар или услугу";
  productSubmit.textContent = "Добавить позицию";
  productCancel.hidden = true;
  setStatus(productStatus, "");
  for (const name of ["name", "category", "type", "price", "rating", "image", "description"]) {
    setFieldError(productForm, name, "");
  }
  updateProductSubmitState();
}

function startEditing(product) {
  getField(productForm, "productId").value = String(product.id);
  getField(productForm, "name").value = product.name;
  getField(productForm, "category").value = product.category;
  getField(productForm, "type").value = product.type;
  getField(productForm, "price").value = String(product.price);
  getField(productForm, "rating").value = String(product.rating);
  getField(productForm, "description").value = product.description;
  getField(productForm, "image").value = product.image;
  getField(productForm, "featured").checked = Boolean(product.featured);
  productFormTitle.textContent = `Редактировать позицию #${product.id}`;
  productSubmit.textContent = "Сохранить изменения";
  productCancel.hidden = false;
  updateProductSubmitState();
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveProduct(event) {
  event.preventDefault();
  const errors = validateProduct();

  for (const name of ["name", "category", "type", "price", "rating", "image", "description"]) {
    setFieldError(productForm, name, errors[name] || "");
  }

  if (Object.keys(errors).length > 0 || !productForm.checkValidity()) {
    setStatus(productStatus, "Исправьте ошибки в форме.", "alert");
    productForm.reportValidity();
    return;
  }

  productSubmit.disabled = true;
  const product = collectProduct();
  const productId = getField(productForm, "productId").value;

  try {
    if (productId) {
      await updateProduct(productId, { ...product, id: Number(productId) });
      showNotice("Позиция каталога обновлена.");
    } else {
      await addProduct(product);
      showNotice("Позиция добавлена в каталог.");
    }
    await loadData();
    resetProductForm();
  } catch (error) {
    setStatus(productStatus, getErrorMessage(error), "alert");
  } finally {
    updateProductSubmitState();
  }
}

async function deleteProduct(product) {
  if (!window.confirm(`Удалить позицию «${product.name}»?`)) {
    return;
  }

  try {
    await removeProduct(product.id);
    if (getField(productForm, "productId").value === String(product.id)) {
      resetProductForm();
    }
    await loadData();
    showNotice("Позиция удалена из каталога.");
  } catch (error) {
    setStatus(productStatus, getErrorMessage(error), "alert");
  }
}

async function deleteFeedback(item) {
  if (!window.confirm("Удалить этот отзыв?")) {
    return;
  }

  try {
    await removeFeedback(item.id);
    feedback = feedback.filter((entry) => entry.id !== item.id);
    renderFeedback();
    showNotice("Отзыв удалён.");
  } catch (error) {
    setStatus(feedbackAdminStatus, getErrorMessage(error), "alert");
  }
}

async function loadData() {
  const [productResponse, userResponse, feedbackResponse] = await Promise.all([
    getProducts(new URLSearchParams({ _sort: "id", _order: "asc" })),
    getUsers(new URLSearchParams({ _sort: "id", _order: "asc" })),
    getFeedback(new URLSearchParams({ _sort: "id", _order: "desc" }))
  ]);
  products = Array.isArray(productResponse.data) ? productResponse.data : [];
  users = Array.isArray(userResponse) ? userResponse : [];
  feedback = Array.isArray(feedbackResponse) ? feedbackResponse : [];
  renderProducts();
  renderSelectOptions();
  renderFeedback();
}

function initialize() {
  renderAccountArea();
  const currentUser = getCurrentUser();

  if (!isAdmin(currentUser)) {
    accessDenied.hidden = false;
    return;
  }

  adminContent.hidden = false;
  adminNavLink.hidden = false;
  bindErrorReset(productForm, updateProductSubmitState);
  productForm.addEventListener("submit", saveProduct);
  productCancel.addEventListener("click", resetProductForm);
  productFilter.addEventListener("change", renderFeedback);
  userFilter.addEventListener("change", renderFeedback);
  updateProductSubmitState();

  loadData().catch((error) => {
    setStatus(productStatus, getErrorMessage(error), "alert");
    setStatus(feedbackAdminStatus, "Отзывы временно недоступны.", "alert");
  });
}

initialize();
