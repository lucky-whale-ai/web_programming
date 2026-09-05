"use strict";

import {
  clearCurrentUser,
  getCurrentUser,
  isAdmin
} from "./auth-store.js";

export const currencyFormatter = new Intl.NumberFormat("ru-BY", {
  style: "currency",
  currency: "BYN",
  maximumFractionDigits: 0
});

export function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

export function setNavigationCounts(favorites, cart) {
  const favoriteCount = favorites.length;
  const cartCount = cart.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

  for (const counter of document.querySelectorAll("[data-favorites-count]")) {
    counter.textContent = String(favoriteCount);
    counter.setAttribute("aria-label", `Позиций в избранном: ${favoriteCount}`);
  }

  for (const counter of document.querySelectorAll("[data-cart-count]")) {
    counter.textContent = String(cartCount);
    counter.setAttribute("aria-label", `Товаров в корзине: ${cartCount}`);
  }
}

export function renderAccountArea() {
  const user = getCurrentUser();

  for (const area of document.querySelectorAll("[data-account-area]")) {
    area.replaceChildren();

    const accountLink = createElement("a", "shop-account__link", user ? "Аккаунт" : "Войти");
    accountLink.href = "account.html";
    area.append(accountLink);

    if (user && isAdmin(user)) {
      const adminLink = createElement("a", "shop-account__link", "Админ-панель");
      adminLink.href = "admin.html";
      area.append(adminLink);
    }

    if (user) {
      const logoutButton = createElement("button", "shop-account__logout", "Выйти");
      logoutButton.type = "button";
      logoutButton.addEventListener("click", () => {
        clearCurrentUser();
        window.location.reload();
      });
      area.append(logoutButton);
    }
  }
}

export function showNotice(message, type = "success") {
  const notice = document.querySelector("#shopNotice");

  if (!notice) {
    return;
  }

  notice.textContent = message;
  notice.dataset.type = type;
  notice.classList.add("is-visible");

  window.clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = window.setTimeout(() => {
    notice.classList.remove("is-visible");
  }, 3200);
}

export function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Произошла неизвестная ошибка. Повторите действие.";
}

export function createStateMessage({ title, description, actionText, onAction, href }) {
  const section = createElement("section", "catalog-empty");
  const content = createElement("div", "catalog-empty__content");
  content.append(
    createElement("h3", "", title),
    createElement("p", "", description)
  );

  if (actionText && href) {
    const link = createElement("a", "catalog-reset shop-state-link", actionText);
    link.href = href;
    content.append(link);
  } else if (actionText && onAction) {
    const button = createElement("button", "catalog-reset", actionText);
    button.type = "button";
    button.addEventListener("click", onAction);
    content.append(button);
  }

  section.append(content);
  return section;
}

export function createProductCard(product, options = {}) {
  const {
    favoriteActive = false,
    cartQuantity = 0,
    onFavorite,
    onCart,
    favoriteActionText
  } = options;

  const card = createElement("article", "catalog-card");
  card.dataset.id = String(product.id);

  const imageWrap = createElement("div", "catalog-card__image-wrap");
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";
  image.decoding = "async";
  imageWrap.append(image);

  if (product.featured) {
    imageWrap.append(createElement("span", "catalog-card__badge", "Рекомендуем"));
  }

  const content = createElement("div", "catalog-card__content");
  const meta = createElement("div", "catalog-card__meta");
  meta.append(
    createElement("span", "", product.category),
    createElement("span", "", product.type)
  );

  const title = createElement("h3", "", product.name);
  const description = createElement("p", "catalog-card__description", product.description);
  const footer = createElement("div", "catalog-card__footer");
  const price = createElement("div", "catalog-card__price");
  const pricePrefix = product.type === "Услуга" ? "от " : "";
  price.append(createElement("strong", "", `${pricePrefix}${currencyFormatter.format(product.price)}`));

  const ratingValue = Number(product.rating).toFixed(1);
  const rating = createElement("span", "catalog-card__rating", `★ ${ratingValue}`);
  rating.setAttribute("aria-label", `Рейтинг ${ratingValue} из 5`);
  footer.append(price, rating);
  content.append(meta, title, description, footer);

  const actions = createElement("div", "catalog-card__actions");

  if (onFavorite) {
    const favoriteButton = createElement(
      "button",
      `shop-action shop-action--favorite${favoriteActive ? " is-active" : ""}`,
      favoriteActionText || (favoriteActive ? "Убрать из избранного" : "В избранное")
    );
    favoriteButton.type = "button";
    favoriteButton.setAttribute("aria-pressed", String(favoriteActive));

    favoriteButton.addEventListener("click", async () => {
      favoriteButton.disabled = true;

      try {
        const isActive = await onFavorite(product);
        favoriteButton.classList.toggle("is-active", isActive);
        favoriteButton.setAttribute("aria-pressed", String(isActive));
        favoriteButton.textContent = isActive ? "Убрать из избранного" : "В избранное";
      } catch (error) {
        showNotice(getErrorMessage(error), "error");
      } finally {
        favoriteButton.disabled = false;
      }
    });

    actions.append(favoriteButton);
  }

  if (onCart) {
    const cartLabel = cartQuantity > 0 ? `Добавить ещё · ${cartQuantity}` : "В корзину";
    const cartButton = createElement(
      "button",
      `shop-action shop-action--cart${cartQuantity > 0 ? " is-active" : ""}`,
      cartLabel
    );
    cartButton.type = "button";

    cartButton.addEventListener("click", async () => {
      cartButton.disabled = true;

      try {
        const quantity = await onCart(product);
        cartButton.classList.toggle("is-active", quantity > 0);
        cartButton.textContent = quantity > 0 ? `Добавить ещё · ${quantity}` : "В корзину";
      } catch (error) {
        showNotice(getErrorMessage(error), "error");
      } finally {
        cartButton.disabled = false;
      }
    });

    actions.append(cartButton);
  }

  if (actions.childElementCount > 0) {
    content.append(actions);
  }

  card.append(imageWrap, content);
  return card;
}
