"use strict";

const SESSION_KEY = "str.currentUser.v1";

export function getCurrentUser() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");

    if (!stored || !Number.isFinite(Number(stored.id)) || !stored.role) {
      return null;
    }

    return {
      id: Number(stored.id),
      role: String(stored.role),
      nickname: String(stored.nickname || ""),
      firstName: String(stored.firstName || ""),
      email: String(stored.email || "")
    };
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  const session = {
    id: Number(user.id),
    role: String(user.role || "buyer"),
    nickname: String(user.nickname || ""),
    firstName: String(user.firstName || ""),
    email: String(user.email || "")
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearCurrentUser() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function isAdmin(user = getCurrentUser()) {
  return Boolean(user && user.role === "admin");
}

export function getSafeReturnPath(fallback = "catalog.html") {
  const requested = new URLSearchParams(window.location.search).get("return");

  if (!requested || !/^[\w./-]+\.html(?:#[\w-]+)?$/.test(requested)) {
    return fallback;
  }

  return requested;
}
