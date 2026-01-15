// Simple front-end app for ETHIOPIA restaurant
// No build tools required – pure vanilla JS.

const DISHES = [
  {
    id: "doro-wot",
    name: "Doro Wot",
    description: "Slow-cooked chicken stew with berbere, served with injera and soft-boiled egg.",
    price: 12.5,
    spice: "hot",
    badge: "Chef's pick",
    image: "images/doro-wot.jpg", // Change this path to your doro wat image
  },
  {
    id: "kikil",
    name: "Kikil",
    description: "Comforting bone-in beef soup with potatoes, carrots, and warming spices.",
    price: 10.0,
    spice: "mild",
    badge: "Comfort bowl",
    image: "images/kikil.jpg", // Change this path to your kikil image
  },
  {
    id: "tibs",
    name: "Tibs",
    description: "Sizzling pan-fried beef cubes with onions, peppers, and rosemary.",
    price: 13.0,
    spice: "medium",
    badge: "Sizzling plate",
    image: "images/tibs.jpg", // Change this path to your tibs image
  },
  {
    id: "kitfo",
    name: "Kitfo",
    description: "Finely minced beef with spiced clarified butter and mitmita, served with gomen.",
    price: 14.5,
    spice: "hot",
    badge: "For spice lovers",
    image: "images/kitfo.jpg", // Change this path to your kitfo image
  },
];

// Local storage helpers
const STORAGE_KEYS = {
  CART: "ethiopia_cart",
  FAVS: "ethiopia_favorites",
  USER: "ethiopia_user",
};

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// App state
let cart = readStorage(STORAGE_KEYS.CART, []); // [{id, qty}]
let favorites = new Set(readStorage(STORAGE_KEYS.FAVS, [])); // ids
let currentFilter = "all";
let searchTerm = "";

// Elements
const menuGrid = document.getElementById("menuGrid");
const favoritesCountEl = document.getElementById("favoritesCount");
const cartCountEl = document.getElementById("cartCount");
const searchInput = document.getElementById("searchInput");
const overlay = document.getElementById("overlay");
const cartDrawer = document.getElementById("cartDrawer");
const cartItemsEl = document.getElementById("cartItems");
const cartSubEl = document.getElementById("cartSub");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const yearEl = document.getElementById("year");
const contactForm = document.getElementById("contactForm");
const contactHint = document.getElementById("contactHint");

const btnCart = document.getElementById("btnCart");
const btnCloseCart = document.getElementById("btnCloseCart");
const btnClearCart = document.getElementById("btnClearCart");
const btnCheckout = document.getElementById("btnCheckout");
const btnSignIn = document.getElementById("btnSignIn");
const btnBook = document.getElementById("btnBook");
const btnStory = document.getElementById("btnStory");
const btnFavorites = document.getElementById("btnFavorites");
const btnHamburger = document.getElementById("btnHamburger");
const mobileNav = document.getElementById("mobileNav");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const btnCloseModal = document.getElementById("btnCloseModal");

// Nav highlighting & smooth scroll
const navLinks = document.querySelectorAll("[data-nav]");

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth",
        });
      }
    }
    setActiveNav(link.dataset.nav);
    if (mobileNav && !mobileNav.hidden) {
      toggleMobileNav(false);
    }
  });
});

function setActiveNav(name) {
  document
    .querySelectorAll(".nav__link, .mobile-nav__link")
    .forEach((el) => el.classList.remove("is-active"));
  document
    .querySelectorAll(`[data-nav='${name}']`)
    .forEach((el) => el.classList.add("is-active"));
}

// Mobile nav
function toggleMobileNav(force) {
  const isOpen = force !== undefined ? force : mobileNav.hidden;
  mobileNav.hidden = !isOpen;
  btnHamburger.setAttribute("aria-expanded", String(isOpen));
}

if (btnHamburger && mobileNav) {
  btnHamburger.addEventListener("click", () => toggleMobileNav());
}

// Menu rendering
function dishMatchesFilters(dish) {
  if (currentFilter !== "all" && dish.spice !== currentFilter) return false;
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  return (
    dish.name.toLowerCase().includes(term) ||
    dish.description.toLowerCase().includes(term)
  );
}

function renderMenu() {
  if (!menuGrid) return;
  menuGrid.innerHTML = "";

  const visible = DISHES.filter(dishMatchesFilters);

  if (!visible.length) {
    menuGrid.innerHTML =
      '<div class="cart-empty">No dishes match your search. Try clearing filters.</div>';
    return;
  }

  visible.forEach((dish) => {
    const isFav = favorites.has(dish.id);
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__media">
        ${dish.image ? `<img src="${dish.image}" alt="${dish.name}" />` : ''}
      </div>
      <div class="card__body">
        <div class="card__top">
          <div>
            <div class="card__name">${dish.name}</div>
            <div class="card__desc">${dish.description}</div>
          </div>
          <span class="tag">${dish.badge}</span>
        </div>
        <div class="price-row">
          <div>
            <div class="price">$${dish.price.toFixed(2)}</div>
            <div class="card__meta" style="color:var(--muted);font-size:11px;margin-top:3px;">
              Spice: ${dish.spice.charAt(0).toUpperCase() + dish.spice.slice(1)}
            </div>
          </div>
          <div class="card__actions">
            <button
              class="mini-btn ${isFav ? "is-fav" : ""}"
              type="button"
              data-fav="${dish.id}"
              aria-label="Toggle favorite for ${dish.name}"
            >
              ♥
            </button>
            <button
              class="add-btn"
              type="button"
              data-add="${dish.id}"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    `;

    menuGrid.appendChild(card);
  });
}

// Favorites
function updateFavoritesBadge() {
  if (!favoritesCountEl) return;
  favoritesCountEl.textContent = String(favorites.size);
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  writeStorage(STORAGE_KEYS.FAVS, Array.from(favorites));
  updateFavoritesBadge();
  renderMenu();
}

// Cart
function getCartQty() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  if (!cartCountEl) return;
  cartCountEl.textContent = String(getCartQty());
}

function addToCart(id) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });
  writeStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
  renderCart();
  openCart();
}

function setQty(id, delta) {
  const existing = cart.find((item) => item.id === id);
  if (!existing) return;
  existing.qty += delta;
  if (existing.qty <= 0) {
    cart = cart.filter((it) => it.id !== id);
  }
  writeStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((it) => it.id !== id);
  writeStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
  renderCart();
}

function clearCart() {
  cart = [];
  writeStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
  renderCart();
}

function renderCart() {
  if (!cartItemsEl || !cartSubEl || !subtotalEl || !totalEl) return;

  if (!cart.length) {
    cartItemsEl.innerHTML =
      '<div class="cart-empty">Your cart is empty. Add some dishes from the menu.</div>';
    cartSubEl.textContent = "0 items";
    subtotalEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    return;
  }

  cartItemsEl.innerHTML = "";
  let subtotal = 0;
  const qtyTotal = getCartQty();

  cart.forEach((item) => {
    const dish = DISHES.find((d) => d.id === item.id);
    if (!dish) return;
    const lineTotal = dish.price * item.qty;
    subtotal += lineTotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div>
        <div class="cart-item__name">${dish.name}</div>
        <div class="cart-item__meta">
          $${dish.price.toFixed(2)} • Qty ${item.qty} • Line $${lineTotal.toFixed(
            2
          )}
        </div>
        <button class="remove" type="button" data-remove="${dish.id}">
          Remove
        </button>
      </div>
      <div class="qty">
        <button class="qty__btn" type="button" data-qty="-1" data-id="${
          dish.id
        }">−</button>
        <span class="qty__num">${item.qty}</span>
        <button class="qty__btn" type="button" data-qty="1" data-id="${
          dish.id
        }">+</button>
      </div>
    `;

    cartItemsEl.appendChild(div);
  });

  cartSubEl.textContent =
    qtyTotal === 1 ? "1 item in cart" : `${qtyTotal} items in cart`;
  const delivery = qtyTotal ? 2.99 : 0;
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  deliveryEl.textContent = delivery ? `$${delivery.toFixed(2)}` : "$0.00";
  totalEl.textContent = `$${(subtotal + delivery).toFixed(2)}`;
}

// Drawer & modal helpers
function openOverlay() {
  if (overlay) overlay.hidden = false;
}
function closeOverlay() {
  if (overlay) overlay.hidden = true;
}

function openCart() {
  if (!cartDrawer) return;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  openOverlay();
}

function closeCart() {
  if (!cartDrawer) return;
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  closeOverlay();
}

function openModal(title, bodyHTML) {
  if (!modal) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "grid";
  openOverlay();
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.style.display = "none";
  closeOverlay();
}

// Event wiring
if (btnCart) btnCart.addEventListener("click", openCart);
if (btnCloseCart) btnCloseCart.addEventListener("click", closeCart);
if (btnClearCart) btnClearCart.addEventListener("click", clearCart);
if (btnCheckout)
  btnCheckout.addEventListener("click", () => {
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }
    openModal(
      "Checkout (demo)",
      `<p>This is a demo checkout. In a real app you would enter payment details here.</p>
       <p>For now, we’ll just clear your cart and say thank you.</p>
       <div class="btns">
         <button class="btn btn--ghost" type="button" id="btnCloseCheckout">Cancel</button>
         <button class="btn btn--primary" type="button" id="btnConfirmCheckout">Place order</button>
       </div>`
    );

    const btnConfirm = document.getElementById("btnConfirmCheckout");
    const btnCancel = document.getElementById("btnCloseCheckout");
    if (btnCancel)
      btnCancel.addEventListener("click", () => {
        closeModal();
      });
    if (btnConfirm)
      btnConfirm.addEventListener("click", () => {
        clearCart();
        closeModal();
        alert("Order placed! (demo)");
      });
  });

if (overlay)
  overlay.addEventListener("click", () => {
    closeCart();
    closeModal();
  });
if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

// Menu interaction – delegate clicks
if (menuGrid) {
  menuGrid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const addId = target.getAttribute("data-add");
    const favId = target.getAttribute("data-fav");

    if (addId) {
      addToCart(addId);
    } else if (favId) {
      toggleFavorite(favId);
    }
  });
}

// Spice filter buttons
document.querySelectorAll(".segmented__btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.getAttribute("data-filter");
    if (!filter) return;
    currentFilter = filter;
    document
      .querySelectorAll(".segmented__btn")
      .forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderMenu();
  });
});

// Search
if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();
    renderMenu();
  });
}

// Favorites button (shows simple modal with list)
if (btnFavorites) {
  btnFavorites.addEventListener("click", () => {
    if (!favorites.size) {
      openModal("Favorites", "<p>You have no favorites yet. Tap the ♥ icon on dishes to add them.</p>");
      return;
    }
    const favDishes = DISHES.filter((d) => favorites.has(d.id));
    const items = favDishes
      .map(
        (d) =>
          `<li>${d.name} <span style="color:var(--muted);font-size:12px;">— $${d.price.toFixed(
            2
          )}</span></li>`
      )
      .join("");
    openModal(
      "Your favorites",
      `<p>These dishes are saved on this device.</p><ul style="margin-top:8px; padding-left:18px;">${items}</ul>`
    );
  });
}

// Sign in modal (demo)
if (btnSignIn) {
  btnSignIn.addEventListener("click", () => {
    const savedUser = readStorage(STORAGE_KEYS.USER, null);
    const emailVal = savedUser?.email || "";
    openModal(
      "Sign in (demo)",
      `<p>This is a demo sign-in. We only store your name locally in this browser.</p>
       <div class="row">
         <input id="signinName" placeholder="Your name" value="${savedUser?.name || ""}" />
         <input id="signinEmail" placeholder="Email (optional)" type="email" value="${emailVal}" />
       </div>
       <div class="btns">
         <button class="btn btn--ghost" type="button" id="btnCancelSignIn">Cancel</button>
         <button class="btn btn--primary" type="button" id="btnSaveSignIn">Save</button>
       </div>`
    );

    const btnCancel = document.getElementById("btnCancelSignIn");
    const btnSave = document.getElementById("btnSaveSignIn");
    const nameInput = document.getElementById("signinName");
    const emailInput = document.getElementById("signinEmail");

    if (btnCancel)
      btnCancel.addEventListener("click", () => {
        closeModal();
      });

    if (btnSave)
      btnSave.addEventListener("click", () => {
        const name = nameInput && nameInput.value ? nameInput.value.trim() : "";
        const email = emailInput && emailInput.value ? emailInput.value.trim() : "";
        if (!name) {
          alert("Please enter your name.");
          return;
        }
        writeStorage(STORAGE_KEYS.USER, { name, email });
        closeModal();
        alert(`Welcome, ${name}! (stored only on this device)`);
      });
  });
}

// Book table modal
if (btnBook) {
  btnBook.addEventListener("click", () => {
    openModal(
      "Book a table (demo)",
      `<p>Choose your date and time and we'll confirm via phone or email.</p>
       <div class="row">
         <input id="bookDate" type="date" />
         <input id="bookTime" type="time" />
       </div>
       <div class="btns">
         <button class="btn btn--ghost" type="button" id="btnCancelBooking">Cancel</button>
         <button class="btn btn--primary" type="button" id="btnSaveBooking">Request booking</button>
       </div>`
    );

    const btnCancel = document.getElementById("btnCancelBooking");
    const btnSave = document.getElementById("btnSaveBooking");
    const dateInput = document.getElementById("bookDate");
    const timeInput = document.getElementById("bookTime");

    if (btnCancel)
      btnCancel.addEventListener("click", () => {
        closeModal();
      });

    if (btnSave)
      btnSave.addEventListener("click", () => {
        const date = dateInput && dateInput.value;
        const time = timeInput && timeInput.value;
        if (!date || !time) {
          alert("Please choose both a date and time.");
          return;
        }
        closeModal();
        alert(`Booking requested for ${date} at ${time}. (demo only)`);
      });
  });
}

// Story modal
if (btnStory) {
  btnStory.addEventListener("click", () => {
    openModal(
      "Our story",
      `<p>ETHIOPIA is a modern spin on classic Ethiopian dining, inspired by family kitchens and night markets.</p>
       <p>We focus on four signature dishes – Doro Wot, Kikil, Tibs, and Kitfo – prepared with patience, spice, and care.</p>`
    );
  });
}

// Contact form (fake submit)
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get("name") || "Guest";
    contactHint.textContent = `Thank you, ${name}! We received your message (demo only).`;
    contactForm.reset();
  });
}

// Cart body delegation
if (cartItemsEl) {
  cartItemsEl.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const removeId = target.getAttribute("data-remove");
    const qtyDelta = target.getAttribute("data-qty");
    const qtyId = target.getAttribute("data-id");

    if (removeId) {
      removeFromCart(removeId);
    } else if (qtyDelta && qtyId) {
      const delta = parseInt(qtyDelta, 10);
      setQty(qtyId, delta);
    }
  });
}

// Year
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

// Initial render
renderMenu();
updateFavoritesBadge();
updateCartBadge();
renderCart();

