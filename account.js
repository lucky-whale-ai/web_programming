"use strict";

import {
  addUser,
  getUsers
} from "./api.js";
import {
  clearCurrentUser,
  getCurrentUser,
  getSafeReturnPath,
  isAdmin,
  setCurrentUser
} from "./auth-store.js";
import {
  bindErrorReset,
  generateNickname,
  generateStrongPassword,
  getField,
  hashPassword,
  isAtLeast16YearsOld,
  normalizeBelarusPhone,
  setFieldError,
  validatePassword
} from "./form-utils.js";
import { showNotice } from "./shop-ui.js";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginStatus = document.querySelector("#loginStatus");
const registerStatus = document.querySelector("#registerStatus");
const registerSubmit = document.querySelector("#registerSubmit");
const generateNicknameButton = document.querySelector("#generateNickname");
const nicknameAttemptsMessage = document.querySelector("#nicknameAttempts");
const passwordOutput = document.querySelector("#generatedPassword");
const passwordOutputValue = document.querySelector("#generatedPasswordValue");
const accountSession = document.querySelector("#accountSession");
const accountSessionName = document.querySelector("#accountSessionName");
const accountLogout = document.querySelector("#accountLogout");
const adminNavLink = document.querySelector("#adminNavLink");

let users = [];
let nicknameAttempts = 0;
let usersLoaded = false;

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `form-status${type ? ` form-${type}` : ""}`;
}

function getRegistrationValues() {
  return {
    firstName: getField(registerForm, "firstName").value.trim(),
    lastName: getField(registerForm, "lastName").value.trim(),
    patronymic: getField(registerForm, "patronymic").value.trim(),
    birthDate: getField(registerForm, "birthDate").value,
    phone: getField(registerForm, "phone").value.trim(),
    email: getField(registerForm, "email").value.trim().toLowerCase(),
    nickname: getField(registerForm, "nickname").value.trim(),
    password: getField(registerForm, "password").value,
    passwordConfirm: getField(registerForm, "passwordConfirm").value,
    passwordMode: getField(registerForm, "passwordMode").value,
    agreement: getField(registerForm, "agreement").checked
  };
}

function getRegistrationErrors(values) {
  const errors = {};
  const namePattern = /^[\p{L} .'-]+$/u;

  if (values.firstName.length < 2 || !namePattern.test(values.firstName)) {
    errors.firstName = "Введите имя буквами, не менее 2 символов.";
  }

  if (values.lastName.length < 2 || !namePattern.test(values.lastName)) {
    errors.lastName = "Введите фамилию буквами, не менее 2 символов.";
  }

  if (values.patronymic && (values.patronymic.length < 2 || !namePattern.test(values.patronymic))) {
    errors.patronymic = "Проверьте написание отчества.";
  }

  if (!values.birthDate) {
    errors.birthDate = "Укажите дату рождения.";
  } else if (!isAtLeast16YearsOld(values.birthDate)) {
    errors.birthDate = "Зарегистрироваться можно только с 16 лет.";
  }

  if (!normalizeBelarusPhone(values.phone)) {
    errors.phone = "Введите действующий номер РБ: +375 25/29/33/44 и 7 цифр.";
  }

  const emailField = getField(registerForm, "email");
  if (!values.email || emailField.validity.typeMismatch) {
    errors.email = "Введите корректный email.";
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]{2,23}$/.test(values.nickname)) {
    errors.nickname = "Никнейм: 3–24 символа, латинская буква в начале.";
  }

  if (values.passwordMode === "manual") {
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (values.password !== values.passwordConfirm) {
      errors.passwordConfirm = "Пароли должны совпадать.";
    }
  } else if (!values.password) {
    errors.password = "Сгенерируйте пароль повторно или выберите ручной ввод.";
  }

  if (!values.agreement) {
    errors.agreement = "Подтвердите прочтение соглашения.";
  }

  return errors;
}

function applyRegistrationErrors(errors) {
  for (const name of [
    "firstName", "lastName", "patronymic", "birthDate", "phone", "email", "nickname",
    "password", "passwordConfirm", "agreement"
  ]) {
    setFieldError(registerForm, name, errors[name] || "");
  }
}

function updateRegisterButton() {
  const values = getRegistrationValues();
  const errors = getRegistrationErrors(values);
  registerSubmit.disabled = !usersLoaded || Object.keys(errors).length > 0 || !registerForm.checkValidity();
}

function selectedPasswordMode() {
  return getField(registerForm, "passwordMode").value;
}

function setGeneratedPassword() {
  const password = generateStrongPassword();
  getField(registerForm, "password").value = password;
  passwordOutputValue.textContent = password;
  passwordOutput.hidden = false;
}

function updatePasswordMode() {
  const password = getField(registerForm, "password");
  const confirm = getField(registerForm, "passwordConfirm");
  const automatic = selectedPasswordMode() === "automatic";

  password.readOnly = automatic;
  confirm.disabled = automatic;
  confirm.required = !automatic;

  if (automatic) {
    setGeneratedPassword();
  } else {
    passwordOutput.hidden = true;
    password.value = "";
    confirm.value = "";
  }

  updateRegisterButton();
}

function updateNicknameMessage(message = "") {
  if (message) {
    setFieldError(registerForm, "nickname", message);
  }

  if (nicknameAttempts >= 5) {
    nicknameAttemptsMessage.textContent = "5 попыток использовано. Введите никнейм самостоятельно.";
    getField(registerForm, "nickname").readOnly = false;
    generateNicknameButton.disabled = true;
    return;
  }

  nicknameAttemptsMessage.textContent = `Попытки генерации: ${nicknameAttempts} из 5.`;
}

function isNicknameTaken(nickname) {
  return users.some((user) => String(user.nickname || "").toLowerCase() === nickname.toLowerCase());
}

function createNickname() {
  const values = getRegistrationValues();
  const candidate = generateNickname(values.firstName, values.lastName);
  nicknameAttempts += 1;

  if (isNicknameTaken(candidate)) {
    updateNicknameMessage("Сгенерированный никнейм уже занят. Попробуйте ещё раз.");
    return;
  }

  getField(registerForm, "nickname").value = candidate;
  setFieldError(registerForm, "nickname", "");
  updateNicknameMessage();
  updateRegisterButton();
}

async function refreshUsers() {
  const response = await getUsers();
  users = Array.isArray(response) ? response : [];
  usersLoaded = true;
}

function checkUniqueValues(values) {
  const normalizedPhone = normalizeBelarusPhone(values.phone);
  const errors = {};

  if (users.some((user) => String(user.email || "").toLowerCase() === values.email)) {
    errors.email = "Пользователь с таким email уже зарегистрирован.";
  }

  if (users.some((user) => normalizeBelarusPhone(user.phone) === normalizedPhone)) {
    errors.phone = "Пользователь с таким номером уже зарегистрирован.";
  }

  if (isNicknameTaken(values.nickname)) {
    errors.nickname = "Этот никнейм уже занят.";
  }

  return errors;
}

async function register(event) {
  event.preventDefault();
  setStatus(registerStatus, "");

  const values = getRegistrationValues();
  const errors = getRegistrationErrors(values);
  applyRegistrationErrors(errors);

  if (Object.keys(errors).length > 0 || !registerForm.checkValidity()) {
    setStatus(registerStatus, "Исправьте ошибки в форме.", "alert");
    registerForm.reportValidity();
    return;
  }

  registerSubmit.disabled = true;

  try {
    await refreshUsers();
    const uniqueErrors = checkUniqueValues(values);
    applyRegistrationErrors(uniqueErrors);

    if (Object.keys(uniqueErrors).length > 0) {
      setStatus(registerStatus, "Используйте другие контактные данные или никнейм.", "alert");
      return;
    }

    const user = await addUser({
      phone: normalizeBelarusPhone(values.phone),
      email: values.email,
      birthDate: values.birthDate,
      firstName: values.firstName,
      lastName: values.lastName,
      patronymic: values.patronymic,
      nickname: values.nickname,
      passwordHash: await hashPassword(values.password),
      role: "buyer",
      createdAt: new Date().toISOString()
    });

    setCurrentUser(user);
    setStatus(registerStatus, "Регистрация выполнена. Открываем каталог.", "success");
    showNotice("Профиль создан.");
    window.setTimeout(() => {
      window.location.href = getSafeReturnPath("catalog.html");
    }, 400);
  } catch (error) {
    setStatus(registerStatus, error.message || "Не удалось завершить регистрацию.", "alert");
  } finally {
    updateRegisterButton();
  }
}

function loginErrors() {
  const login = getField(loginForm, "login");
  const password = getField(loginForm, "loginPassword");
  const errors = {};

  if (!login.value.trim()) {
    errors.login = "Введите email или телефон.";
  }

  if (!password.value) {
    errors.loginPassword = "Введите пароль.";
  }

  return errors;
}

async function login(event) {
  event.preventDefault();
  setStatus(loginStatus, "");
  const errors = loginErrors();

  setFieldError(loginForm, "login", errors.login || "");
  setFieldError(loginForm, "loginPassword", errors.loginPassword || "");

  if (Object.keys(errors).length > 0) {
    loginForm.reportValidity();
    return;
  }

  try {
    await refreshUsers();
    const loginValue = getField(loginForm, "login").value.trim().toLowerCase();
    const user = users.find((candidate) => (
      String(candidate.email || "").toLowerCase() === loginValue
      || String(candidate.phone || "").toLowerCase() === loginValue
      || normalizeBelarusPhone(candidate.phone) === normalizeBelarusPhone(loginValue)
    ));
    const passwordHash = await hashPassword(getField(loginForm, "loginPassword").value);

    if (!user || user.passwordHash !== passwordHash) {
      setStatus(loginStatus, "Неверный email, телефон или пароль.", "alert");
      setFieldError(loginForm, "login", "Проверьте данные для входа.");
      return;
    }

    setCurrentUser(user);
    setStatus(loginStatus, "Вход выполнен.", "success");
    showNotice("Вы вошли в профиль.");
    window.setTimeout(() => {
      window.location.href = getSafeReturnPath("catalog.html");
    }, 300);
  } catch (error) {
    setStatus(loginStatus, error.message || "Не удалось выполнить вход.", "alert");
  }
}

function renderSession() {
  const user = getCurrentUser();

  if (!user) {
    accountSession.hidden = true;
    adminNavLink.hidden = true;
    return;
  }

  accountSession.hidden = false;
  accountSessionName.textContent = user.nickname || user.firstName || user.email;
  adminNavLink.hidden = !isAdmin(user);
}

bindErrorReset(loginForm);
bindErrorReset(registerForm, (field) => {
  if (field.name === "firstName" || field.name === "lastName") {
    const nickname = getField(registerForm, "nickname");
    if (!nickname.value && nicknameAttempts === 0) {
      nickname.value = generateNickname(
        getField(registerForm, "firstName").value,
        getField(registerForm, "lastName").value
      );
    }
  }
  updateRegisterButton();
});

for (const mode of registerForm.querySelectorAll("input[name='passwordMode']")) {
  mode.addEventListener("change", updatePasswordMode);
}
getField(registerForm, "passwordConfirm").addEventListener("paste", (event) => {
  event.preventDefault();
  setFieldError(registerForm, "passwordConfirm", "Введите пароль вручную, без вставки.");
});
generateNicknameButton.addEventListener("click", createNickname);
getField(registerForm, "password").addEventListener("input", updateRegisterButton);
loginForm.addEventListener("submit", login);
registerForm.addEventListener("submit", register);
accountLogout.addEventListener("click", () => {
  clearCurrentUser();
  window.location.reload();
});

renderSession();
updatePasswordMode();

try {
  await refreshUsers();
  if (!getField(registerForm, "nickname").value) {
    getField(registerForm, "nickname").value = generateNickname(
      getField(registerForm, "firstName").value,
      getField(registerForm, "lastName").value
    );
  }
  updateNicknameMessage();
  updateRegisterButton();
} catch (error) {
  setStatus(registerStatus, error.message || "JSON Server недоступен.", "alert");
  registerSubmit.disabled = true;
}
