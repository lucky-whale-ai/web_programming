"use strict";

// Conservative superset of the published 2024 top-100 values. Extra trivial
// variants are rejected as well, which is safer for this educational form.
export const COMMON_PASSWORDS_2024 = new Set([
  "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "123123",
  "000000", "abc123", "password1", "1234567890", "iloveyou", "1q2w3e", "admin", "welcome", "monkey", "login",
  "qwerty123", "dragon", "master", "hello", "freedom", "whatever", "letmein", "princess", "qwertyuiop", "solo",
  "passw0rd", "starwars", "football", "shadow", "sunshine", "trustno1", "654321", "666666", "7777777", "121212",
  "123321", "112233", "987654321", "1qaz2wsx", "qazwsx", "asdfgh", "zxcvbn", "asdfghjkl", "1q2w3e4r", "q1w2e3r4",
  "zaq12wsx", "qwerty1", "password123", "password12", "admin123", "administrator", "guest", "user", "test", "testing",
  "changeme", "default", "pass", "pass123", "secret", "secret123", "welcome1", "welcome123", "summer", "summer2024",
  "winter", "spring", "autumn", "michael", "jennifer", "jordan", "charlie", "andrew", "daniel", "thomas",
  "george", "computer", "internet", "whatever1", "access", "access14", "baseball", "basketball", "soccer", "hockey",
  "liverpool", "arsenal", "blink182", "pokemon", "matrix", "superman", "batman", "ninja", "mustang", "loveme",
  "1qazxsw2", "qwe123", "asd123", "zxc123", "123qwe", "123asd", "123zxc", "2024", "2025", "2026"
]);

export function getField(form, name) {
  return form.elements.namedItem(name);
}

export function setFieldError(form, name, message = "") {
  const field = getField(form, name);
  const control = field && typeof field.setCustomValidity === "function" ? field : field?.[0];
  const error = form.querySelector(`[data-error-for="${name}"]`);

  if (control) {
    control.setCustomValidity(message);
    control.setAttribute("aria-invalid", message ? "true" : "false");
  }

  if (error) {
    error.textContent = message;
  }
}

export function clearFieldError(form, name) {
  setFieldError(form, name, "");
}

export function clearFormErrors(form) {
  for (const error of form.querySelectorAll("[data-error-for]")) {
    clearFieldError(form, error.dataset.errorFor);
  }
}

export function bindErrorReset(form, callback) {
  for (const field of form.querySelectorAll("input, select, textarea")) {
    const reset = () => {
      if (field.name) {
        clearFieldError(form, field.name);
      }
      callback?.(field);
    };
    field.addEventListener("input", reset);
    field.addEventListener("change", reset);
  }
}

export function normalizeBelarusPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = digits.slice(1);
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    digits = `375${digits}`;
  } else if (digits.startsWith("0")) {
    digits = `375${digits.slice(1)}`;
  }

  if (!digits.startsWith("375")) {
    return "";
  }

  const normalized = `+${digits}`;
  return /^\+375(?:25|29|33|44)\d{7}$/.test(normalized) ? normalized : "";
}

export function isAtLeast16YearsOld(value) {
  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  const cutoff = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  return birthDate <= cutoff;
}

export function validatePassword(value) {
  const password = String(value || "");

  if (password.length < 8 || password.length > 20) {
    return "Пароль должен содержать от 8 до 20 символов.";
  }

  if (!/[A-ZА-ЯЁ]/.test(password)) {
    return "Добавьте хотя бы одну заглавную букву.";
  }

  if (!/[a-zа-яё]/.test(password)) {
    return "Добавьте хотя бы одну строчную букву.";
  }

  if (!/\d/.test(password)) {
    return "Добавьте хотя бы одну цифру.";
  }

  if (!/[^\p{L}\d\s]/u.test(password)) {
    return "Добавьте хотя бы один специальный символ.";
  }

  if (COMMON_PASSWORDS_2024.has(password.toLowerCase())) {
    return "Этот пароль входит в список распространённых паролей 2024 года.";
  }

  return "";
}

function randomInt(max) {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] % max;
}

function pick(source) {
  return source[randomInt(source.length)];
}

export function generateStrongPassword(length = 14) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%*-_+?";
  const all = `${upper}${lower}${digits}${special}`;
  const characters = [pick(upper), pick(lower), pick(digits), pick(special)];

  while (characters.length < length) {
    characters.push(pick(all));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

export async function hashPassword(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const TRANSLITERATION = new Map(Object.entries({
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
}));

export function transliterate(value) {
  return String(value || "")
    .toLowerCase()
    .split("")
    .map((letter) => TRANSLITERATION.get(letter) ?? letter)
    .join("")
    .replace(/[^a-z\d]/g, "");
}

export function generateNickname(firstName, lastName) {
  const first = transliterate(firstName).slice(0, 3) || "user";
  const last = transliterate(lastName).slice(0, 3) || "str";
  return `${first[0].toUpperCase()}${first.slice(1)}${last[0].toUpperCase()}${last.slice(1)}${10 + randomInt(990)}`;
}
