"use strict";

export const API_BASE_URL = "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(new URL(path, API_BASE_URL), {
      ...options,
      headers
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("Не удалось подключиться к JSON Server. Проверьте, что сервер запущен на порту 3000.");
  }

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const serverMessage = typeof data === "object" && data?.message
      ? data.message
      : `JSON Server вернул ошибку ${response.status}.`;
    throw new ApiError(serverMessage, response.status);
  }

  const totalHeader = response.headers.get("X-Total-Count");

  return {
    data,
    total: totalHeader === null ? null : Number(totalHeader),
    link: response.headers.get("Link")
  };
}

function withQuery(resource, params) {
  const query = params?.toString();
  return query ? `/${resource}?${query}` : `/${resource}`;
}

export async function getProducts(params = new URLSearchParams(), options = {}) {
  return request(withQuery("products", params), options);
}

export async function getAllProducts(options = {}) {
  const params = new URLSearchParams({
    _sort: "id",
    _order: "asc"
  });
  const response = await getProducts(params, options);
  return response.data;
}

export async function getFavorites(options = {}) {
  const params = new URLSearchParams({
    _expand: "product",
    _sort: "id",
    _order: "asc"
  });
  const response = await request(withQuery("favorites", params), options);
  return response.data;
}

export async function addFavorite(productId) {
  const response = await request("/favorites", {
    method: "POST",
    body: JSON.stringify({ productId: Number(productId) })
  });
  return response.data;
}

export async function removeFavorite(favoriteId) {
  await request(`/favorites/${encodeURIComponent(favoriteId)}`, {
    method: "DELETE"
  });
}

export async function getCart(options = {}) {
  const params = new URLSearchParams({
    _expand: "product",
    _sort: "id",
    _order: "asc"
  });
  const response = await request(withQuery("cart", params), options);
  return response.data;
}

export async function addCartEntry(productId, quantity = 1) {
  const response = await request("/cart", {
    method: "POST",
    body: JSON.stringify({
      productId: Number(productId),
      quantity: Number(quantity)
    })
  });
  return response.data;
}

export async function updateCartEntry(cartId, quantity) {
  const response = await request(`/cart/${encodeURIComponent(cartId)}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity: Number(quantity) })
  });
  return response.data;
}

export async function removeCartEntry(cartId) {
  await request(`/cart/${encodeURIComponent(cartId)}`, {
    method: "DELETE"
  });
}
