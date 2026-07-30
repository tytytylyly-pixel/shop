// ---------- Настройки ----------
const API_URL = "https://fakestoreapi.com/products";

// Свои названия категорий вместо английских из API.
// Слева — оригинальное название от API (менять не нужно),
// справа — то, что увидит покупатель на сайте.
const CATEGORY_NAMES = {
  "men's clothing": "Мужская одежда",
  "women's clothing": "Женская одежда",
  "jewelery": "Украшения",
  "electronics": "Электроника",
};

// Свои картинки для товаров вместо картинок из API.
// Слева — id товара (число), справа — путь к своей картинке.
// Пример ниже подставляет свою картинку только товару с id: 1,
// у остальных товаров картинка останется из API, пока не добавишь свою строку.
const IMAGE_OVERRIDES = {
  1: "images/oversize-futbolka.jpg",
  2: "images/vintage-kofta.jpeg",
  3: "images/bomber-krutoi.jpeg",
  4: "images/nu-pogodi-jeans.jpg",
  5: "images/cepochka.jpg",
  6: "images/kolechko.jpg",
  7: "images/podveska.jpg",
  8: "images/hype-now.jpg",
  15: "images/futbolochka-oversize.jpg",
  16: "images/sviterok.jpg",
  17: "images/skinniki.jpg",
  18: "images/shortiki.jpg",
  19: "images/xydak.jpg",
  20: "images/vodnoe-polo.jpg",
};

// Категории, которые нужно полностью скрыть с сайта (вместе с товарами).
// Впиши сюда точное название категории из API (как в CATEGORY_NAMES слева).
// Пример: ["jewelery"] — скроет категорию "Украшения" и все товары в ней.
const EXCLUDED_CATEGORIES = [
"electronics",
];

// Валюта по умолчанию для всех товаров, у которых не задана своя валюта ниже.
// Поменяй значение здесь, если хочешь одну и ту же валюту для всего магазина.
const DEFAULT_CURRENCY = "₽";

// Свои название/описание/цена/валюта для конкретных товаров (по id).
// Указывай только то, что хочешь изменить у этого товара —
// остальные поля (например, картинка) не трогаются.
// Пример ниже меняет товар с id: 1
const PRODUCT_OVERRIDES = {
  1: {
    title: "Футболка оверсайз",
    description: "Хлопковая футболка собственного пошива, свободный крой.",
    price: 1550,
  },
  2: {
    title: "Архивный лонгслив",
    description: "Свободный крой и рваный стиль.",
    price: 1999,
  },
  3: {
    title: "Бомбер оверсайз",
    description: "Свободный крой, комфорт и удобство.",
    price: 2999,
  },
  4: {
    title: "Джинсы клёш",
    description: "Удобная посадка и собственный пошив.",
    price: 1999,
  },
  5: {
    title: "Цепочка",
    description: "Стильный аксессуар для вашего образа.",
    price: 999,
  },
  6: {
    title: "Колечко",
    description: "Стильный аксессуар для вашего образа.",
    price: 999,
  },
  7: {
    title: "Подвеска",
    description: "Стильный аксессуар для вашего образа.",
    price: 999,
  },
  8: {
    title: "Пиратская цепочка",
    description: "Стильный аксессуар для вашего образа.",
    price: 999,
  },
  15: {
    title: "Футболка оверсайз",
    description: "Хлопковая футболка собственного пошива, свободный крой.",
    price: 1550,
  },
  16: {
    title: "Свитер",
    description: "Приталенный крой и комфорт.",
    price: 1999,
  },
  17: {
    title: "Скинни-джинсы",
    description: "Узкая посадка и собственный пошив.",
    price: 1999,
  },
  18: {
    title: "Шорты",
    description: "Свободный крой и удобство.",
    price: 999,
  },
  19: {
    title: "Худи",
    description: "Свободный крой и комфорт.",
    price: 1999,
  },
  20: {
    title: "Рубашка-поло",
    description: "Собственный пошив и комфорт.",
    price: 1999,
  },
};
// Возвращает своё название категории, если оно указано в CATEGORY_NAMES,
// иначе — оригинальное название от API
function translateCategory(category) {
  return CATEGORY_NAMES[category] || category;
}

// Возвращает свою картинку, если она указана в IMAGE_OVERRIDES,
// иначе — картинку из API
function getProductImage(product) {
  return IMAGE_OVERRIDES[product.id] || product.image;
}

// Все товары храним тут после загрузки
let allProducts = [];

// Корзина: массив объектов { id, title, price, image, quantity }
let cart = loadCartFromStorage();

// ---------- Элементы страницы ----------
const productGrid = document.getElementById("productGrid");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");

const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartModal = document.getElementById("cartModal");
const closeCartModal = document.getElementById("closeCartModal");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");

const productModal = document.getElementById("productModal");
const closeProductModal = document.getElementById("closeProductModal");
const productModalBody = document.getElementById("productModalBody");

const categoryFilter = document.getElementById("categoryFilter");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");
const sizeButtons = document.querySelectorAll(".size-btn");
const resetFiltersButton = document.getElementById("resetFilters");

const authButton = document.getElementById("authButton");
const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Сейчас вошедший пользователь (null, если никто не вошёл)
let currentUser = loadCurrentUserFromStorage();

// Какие размеры сейчас выбраны (можно выбрать несколько)
let selectedSizes = [];

// ---------- Загрузка товаров с API ----------
async function loadProducts() {
  showStatus("Загрузка товаров...", false);

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Сервер вернул ошибку: " + response.status);
    }

    const data = await response.json();

    // Fake Store API не хранит размеры одежды,
    // поэтому назначаем их сами (для демонстрации фильтра).
    // Здесь же подмешиваем свои название/описание/цену/валюту из PRODUCT_OVERRIDES.
    allProducts = data
      .map((product) => {
        const overrides = PRODUCT_OVERRIDES[product.id] || {};

        return {
          ...product,
          ...overrides,
          currency: overrides.currency || DEFAULT_CURRENCY,
          sizes: getRandomSizes(product.id),
        };
      })
      // Убираем товары из скрытых категорий
      .filter((product) => !EXCLUDED_CATEGORIES.includes(product.category));

    fillCategoryFilter(allProducts);

    hideStatus();
    applyFilters();

  } catch (error) {
    showStatus(
      "Не удалось загрузить товары. Проверьте интернет-соединение и обновите страницу.",
      true
    );
    console.error(error);
  }
}

function showStatus(text, isError) {
  statusMessage.textContent = text;
  statusMessage.classList.toggle("error", isError);
  statusMessage.style.display = "block";
  productGrid.style.display = "none";
}

function hideStatus() {
  statusMessage.style.display = "none";
  productGrid.style.display = "grid";
}

// ---------- Отрисовка товаров ----------
function renderProducts(products) {
  productGrid.innerHTML = "";

  if (products.length === 0) {
    productGrid.innerHTML = "<p>Ничего не найдено</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${getProductImage(product)}" alt="${product.title}">
      <div class="product-card__title">${product.title}</div>
      <div class="product-card__price">${product.price} ${product.currency}</div>
      <div class="product-card__buttons">
        <button class="btn btn-secondary" data-action="details" data-id="${product.id}">
          Подробнее
        </button>
        <button class="btn btn-primary" data-action="add" data-id="${product.id}">
          В корзину
        </button>
      </div>
    `;

    productGrid.appendChild(card);
  });
}

// Обрабатываем клики по кнопкам внутри карточек (один обработчик на всю сетку)
productGrid.addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;

  const id = Number(button.dataset.id);
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  if (button.dataset.action === "add") {
    addToCart(product);
  }

  if (button.dataset.action === "details") {
    openProductModal(product);
  }
});

// ---------- Карточка товара (модальное окно) ----------
function openProductModal(product) {
  productModalBody.innerHTML = `
    <div class="product-detail">
      <img src="${getProductImage(product)}" alt="${product.title}">
      <h2>${product.title}</h2>
      <p><strong>Категория:</strong> ${translateCategory(product.category)}</p>
      <p>${product.description}</p>
      <p class="product-card__price">${product.price} ${product.currency}</p>
      <button class="btn btn-primary" id="modalAddToCart">В корзину</button>
    </div>
  `;

  document.getElementById("modalAddToCart").addEventListener("click", () => {
    addToCart(product);
  });

  productModal.classList.remove("hidden");
}

closeProductModal.addEventListener("click", () => {
  productModal.classList.add("hidden");
});

// ---------- Поиск + фильтры (работают вместе) ----------
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
priceMin.addEventListener("input", applyFilters);
priceMax.addEventListener("input", applyFilters);

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const size = button.dataset.size;

    if (selectedSizes.includes(size)) {
      // повторный клик по уже выбранному размеру — снимаем выбор
      selectedSizes = selectedSizes.filter((s) => s !== size);
      button.classList.remove("active");
    } else {
      selectedSizes.push(size);
      button.classList.add("active");
    }

    applyFilters();
  });
});

resetFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  priceMin.value = "";
  priceMax.value = "";
  selectedSizes = [];
  sizeButtons.forEach((button) => button.classList.remove("active"));
  applyFilters();
});

// Собирает список уникальных категорий из товаров и кладёт в select
function fillCategoryFilter(products) {
  const categories = [...new Set(products.map((p) => p.category))];

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = translateCategory(category);
    categoryFilter.appendChild(option);
  });
}

// Назначает товару 1-3 случайных размера (детерминированно по id,
// чтобы при перезагрузке страницы размеры не менялись)
function getRandomSizes(productId) {
  const allSizes = ["S", "M", "L", "XL"];
  const count = (productId % 3) + 1;
  return allSizes.slice(0, count);
}

// Главная функция: применяет поиск + все фильтры одновременно
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const min = priceMin.value ? Number(priceMin.value) : null;
  const max = priceMax.value ? Number(priceMax.value) : null;

  const filtered = allProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(query);
    const matchesCategory = category === "all" || product.category === category;
    const matchesMin = min === null || product.price >= min;
    const matchesMax = max === null || product.price <= max;
    const matchesSize =
      selectedSizes.length === 0 ||
      selectedSizes.some((size) => product.sizes.includes(size));

    return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesSize;
  });

  renderProducts(filtered);
}

// ---------- Корзина ----------
function addToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      currency: product.currency,
      image: getProductImage(product),
      quantity: 1,
    });
  }

  saveCartToStorage();
  updateCartCount();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCartToStorage();
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = `(${totalItems})`;
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Корзина пуста</p>";
    cartTotalEl.textContent = "0";
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item__info">
          <div>${item.title}</div>
          <div>${item.quantity} x ${item.price} ${item.currency}</div>
        </div>
        <button class="cart-item__remove" data-id="${item.id}">Удалить</button>
      </div>
    `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Примечание: если товары в корзине с разными валютами, сумма покажет
  // валюту первого товара — для магазина с одной валютой это не проблема
  const totalCurrency = cart.length > 0 ? cart[0].currency : DEFAULT_CURRENCY;
  cartTotalEl.textContent = `${total.toFixed(2)} ${totalCurrency}`;
}

cartItemsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("cart-item__remove")) {
    const id = Number(e.target.dataset.id);
    removeFromCart(id);
  }
});

cartButton.addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});

closeCartModal.addEventListener("click", () => {
  cartModal.classList.add("hidden");
});

// ---------- LocalStorage ----------
function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("cart");
  return saved ? JSON.parse(saved) : [];
}

// ---------- Регистрация / вход ----------
// ВАЖНО: это простая учебная реализация для фронтенд-проекта без сервера.
// Пароли хранятся в браузере пользователя в открытом виде (localStorage),
// поэтому для настоящего сайта с реальными людьми так делать нельзя —
// там нужен сервер с хешированием паролей. Здесь это демонстрация того,
// как устроена форма регистрации/входа и валидация на фронтенде.

authButton.addEventListener("click", () => {
  if (currentUser) {
    // Если человек уже вошёл — кнопка в шапке работает как "Выйти"
    logoutUser();
  } else {
    openAuthModal();
  }
});

closeAuthModal.addEventListener("click", () => {
  authModal.classList.add("hidden");
});

function openAuthModal() {
  clearAuthErrors();
  loginForm.reset();
  registerForm.reset();
  switchAuthTab("login");
  authModal.classList.remove("hidden");
}

// Переключение между вкладками "Вход" и "Регистрация"
tabLogin.addEventListener("click", () => switchAuthTab("login"));
tabRegister.addEventListener("click", () => switchAuthTab("register"));

function switchAuthTab(tab) {
  clearAuthErrors();

  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
}

// ---------- Регистрация ----------
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearAuthErrors();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const passwordRepeat = document.getElementById("registerPasswordRepeat").value;

  let hasError = false;

  if (name.length < 2) {
    showFieldError("registerNameError", "registerName", "Введите имя (минимум 2 символа)");
    hasError = true;
  }

  if (!isValidEmail(email)) {
    showFieldError("registerEmailError", "registerEmail", "Введите корректный email");
    hasError = true;
  } else if (findUserByEmail(email)) {
    showFieldError("registerEmailError", "registerEmail", "Такой email уже зарегистрирован");
    hasError = true;
  }

  if (password.length < 6) {
    showFieldError("registerPasswordError", "registerPassword", "Пароль должен быть от 6 символов");
    hasError = true;
  }

  if (passwordRepeat !== password) {
    showFieldError("registerPasswordRepeatError", "registerPasswordRepeat", "Пароли не совпадают");
    hasError = true;
  }

  if (hasError) return;

  const users = loadUsersFromStorage();
  users.push({ name, email, password });
  saveUsersToStorage(users);

  loginUser({ name, email });
  authModal.classList.add("hidden");
});

// ---------- Вход ----------
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearAuthErrors();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  let hasError = false;

  if (!isValidEmail(email)) {
    showFieldError("loginEmailError", "loginEmail", "Введите корректный email");
    hasError = true;
  }

  if (password.length === 0) {
    showFieldError("loginPasswordError", "loginPassword", "Введите пароль");
    hasError = true;
  }

  if (hasError) return;

  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    document.getElementById("loginFormError").textContent = "Неверный email или пароль";
    return;
  }

  loginUser({ name: user.name, email: user.email });
  authModal.classList.add("hidden");
});

function loginUser(user) {
  currentUser = user;
  saveCurrentUserToStorage(user);
  updateAuthUI();
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateAuthUI();
}

function updateAuthUI() {
  authButton.textContent = currentUser ? `Привет, ${currentUser.name} (Выйти)` : "Войти";
}

function findUserByEmail(email) {
  const users = loadUsersFromStorage();
  return users.find((u) => u.email === email);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(errorId, inputId, message) {
  document.getElementById(errorId).textContent = message;
  document.getElementById(inputId).classList.add("input-error");
}

function clearAuthErrors() {
  document.querySelectorAll(".form-error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".auth-form input").forEach((el) => el.classList.remove("input-error"));
}

// ---------- LocalStorage для пользователей ----------
function loadUsersFromStorage() {
  const saved = localStorage.getItem("users");
  return saved ? JSON.parse(saved) : [];
}

function saveUsersToStorage(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveCurrentUserToStorage(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function loadCurrentUserFromStorage() {
  const saved = localStorage.getItem("currentUser");
  return saved ? JSON.parse(saved) : null;
}

// ---------- Закрытие модалок по клику на фон ----------
[productModal, cartModal, authModal].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

// ---------- Запуск ----------
updateCartCount();
updateAuthUI();
loadProducts();
// Примечание: applyFilters() вызывается автоматически после loadProducts(),
// когда товары загрузятся — сортировка/поиск/фильтры работают через неё.
