/* FENEX MASTER JAVASCRIPT (Firebase Firestore & Realtime Database Integrated) */

// ১. Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyA4as297Sk35tTVqSQyOUztD5Vg9sV0Oy8",
  authDomain: "fenex-ba1af.firebaseapp.com",
  databaseURL: "https://fenex-ba1af-default-rtdb.firebaseio.com", // Realtime Database URL
  projectId: "fenex-ba1af",
  storageBucket: "fenex-ba1af.firebasestorage.app",
  messagingSenderId: "506989870286",
  appId: "1:506989870286:web:75b50258542b88b443e49f"
};

const ADMIN_EMAIL = "dreamboy50700@gmail.com".toLowerCase();

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const rtdb = firebase.database(); // Realtime Database Instance
const auth = firebase.auth();

let globalProductsCache = [];
let currentUser = null;

const CART_KEY = 'FENEX_CART';
const COUPON_KEY = 'FENEX_APPLIED_COUPON';

// 🔥 REALTIME DATABASE FUNCTIONS (Order Management)
// অর্ডার ডাটাবেজে জমা করার ফাংশন
function saveOrderToRealtimeDB(orderData, callback) {
  const orderId = orderData.orderId || 'ORD-' + Date.now();
  orderData.orderId = orderId;
  orderData.createdAt = orderData.createdAt || new Date().toISOString();

  rtdb.ref('orders/' + orderId).set(orderData)
    .then(() => {
      console.log("Order saved to Realtime Database successfully!");
      if (callback) callback(true, orderId);
    })
    .catch((error) => {
      console.error("Error saving order to Realtime DB:", error);
      if (callback) callback(false, error);
    });
}

// রিয়েল-টাইমে অর্ডার শো করার ফাংশন (Admin & Tracking Pages-এর জন্য)
function listenRealtimeOrders(callback) {
  rtdb.ref('orders').on('value', (snapshot) => {
    const data = snapshot.val();
    const ordersList = [];
    if (data) {
      Object.keys(data).forEach(key => {
        ordersList.push({ id: key, ...data[key] });
      });
    }
    if (callback) callback(ordersList);
  });
}

// ২. কার্ট ফাংশনালিটি
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  renderGlobalCart();
}

function updateCartCount() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  document.querySelectorAll('#cartCount, #cart-count, .badge').forEach(el => {
    el.innerText = totalCount;
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  renderGlobalCart();
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function renderGlobalCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cart = getCart();

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p style="text-align:center; padding: 30px; color: #777;">আপনার কার্ট খালি আছে</p>`;
    if (cartSubtotalEl) cartSubtotalEl.innerText = '৳0';
    return;
  }

  let subtotal = 0;
  let html = '';

  cart.forEach((item, index) => {
    const qty = Number(item.qty || item.quantity || 1);
    const price = Number(item.price || 0);
    const itemTotal = price * qty;
    subtotal += itemTotal;
    const imgUrl = item.image || item.img || 'https://via.placeholder.com/60?text=Product';

    html += `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #eee;">
        <img src="${imgUrl}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'" style="width:55px; height:55px; object-fit:cover; border-radius:6px; background:#f9f9f9;">
        <div style="flex:1;">
          <h4 style="font-size:13px; margin:0 0 3px 0; font-weight:700; color:var(--text-color, #111);">${item.name || item.title}</h4>
          <p style="font-size:11px; color:#666; margin:0 0 4px 0;">Size: ${item.size || 'M'}</p>
          <div style="font-size:12px; font-weight:800; color:var(--text-color, #000);">৳${price} × ${qty} = ৳${itemTotal}</div>
        </div>
        <button onclick="removeCartItem(${index})" style="background:none; border:none; color:#d90429; font-size:18px; cursor:pointer;">&times;</button>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = html;

  const appliedCoupon = JSON.parse(localStorage.getItem(COUPON_KEY));
  if (appliedCoupon && appliedCoupon.code === 'FENEX10') {
    const discount = (subtotal * appliedCoupon.percentage) / 100;
    const finalTotal = subtotal - discount;
    if (cartSubtotalEl) {
      cartSubtotalEl.innerHTML = `<span style="text-decoration:line-through; font-size:0.85em; color:#888;">৳${subtotal}</span> ৳${finalTotal.toFixed(0)} <small style="color:#2ec4b6; font-size:11px;">(10% Off)</small>`;
    }
  } else {
    if (cartSubtotalEl) cartSubtotalEl.innerText = `৳${subtotal}`;
  }
}

function applyCouponCode(inputCode) {
  const code = (inputCode || '').trim().toUpperCase();
  if (code === 'FENEX10') {
    localStorage.setItem(COUPON_KEY, JSON.stringify({ code: 'FENEX10', percentage: 10 }));
    alert('🎉 অভিনন্দন! FENEX10 কুপনে ১০% ছাড় যোগ হয়েছে।');
    renderGlobalCart();
    return true;
  } else {
    alert('❌ দুঃখিত, কুপন কোডটি সঠিক নয়!');
    return false;
  }
}

function removeCouponCode() {
  localStorage.removeItem(COUPON_KEY);
  renderGlobalCart();
}

function removeCartItem(index) {
  let cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function toggleCategory(gender) {
  const menPopup = document.getElementById('men-popup');
  const womenPopup = document.getElementById('women-popup');
  if (gender === 'men') {
    if (menPopup) menPopup.style.display = menPopup.style.display === 'block' ? 'none' : 'block';
    if (womenPopup) womenPopup.style.display = 'none';
  } else if (gender === 'women') {
    if (womenPopup) womenPopup.style.display = womenPopup.style.display === 'block' ? 'none' : 'block';
    if (menPopup) menPopup.style.display = 'none';
  }
}

// ৩. প্রোডাক্টস ফায়ারবেস লোডার
function fetchFirebaseProducts(callback) {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    globalProductsCache = products;
    if (callback) callback(products);
  }, (error) => {
    console.error("Firestore Fetch Error: ", error);
  });
}

// ৪. ক্যাটাগরি ও জেন্ডার ফিল্টারিং লজিক
function loadCategoryProducts() {
  const productContainer = document.getElementById("productGrid") 
                        || document.getElementById("featuredProductsGrid") 
                        || document.getElementById("shopProductGrid");

  if (!productContainer) return;

  productContainer.innerHTML = `
    <div style="text-align: center; grid-column: 1/-1; padding: 40px 0;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: #888;"></i>
      <p style="margin-top: 10px; color: #666; font-size: 14px;">প্রোডাক্টস লোড হচ্ছে...</p>
    </div>
  `;

  fetchFirebaseProducts((allProducts) => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const selectedGender = (urlParams.get('gender') || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectedCategory = (urlParams.get('category') || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const filteredProducts = allProducts.filter(p => {
      const pGender = (p.gender || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const pCategory = (p.category || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const matchGender = !selectedGender || selectedGender === 'all' || pGender === selectedGender || pGender.includes(selectedGender) || selectedGender.includes(pGender);
      const matchCategory = !selectedCategory || selectedCategory === 'all' || pCategory === selectedCategory || pCategory.includes(selectedCategory) || selectedCategory.includes(pCategory);

      return matchGender && matchCategory;
    });

    if (filteredProducts.length === 0) {
      productContainer.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 40px 0; width: 100%;">
          <h3 style="font-size: 1.2rem; color: var(--muted-text, #777); margin-bottom: 8px;">No products found!</h3>
          <p style="font-size: 0.85rem; color: #999;">এই ক্যাটাগরিতে কোনো প্রোডাক্ট যুক্ত করা হয়নি।</p>
        </div>
      `;
      return;
    }

    productContainer.innerHTML = filteredProducts.map(p => `
      <div class="product-card">
        <div class="product-img-wrapper" onclick="goToDetails('${p.id}')">
          <img src="${p.image}" alt="${p.name || p.title}" onerror="this.src='https://via.placeholder.com/300'">
        </div>
        <div class="product-info">
          <span class="product-category">${p.gender ? p.gender.toUpperCase() : ''} ${p.category ? '| ' + p.category : ''}</span>
          <h4 class="product-title" onclick="goToDetails('${p.id}')">${p.name || p.title}</h4>
          <div class="product-price">৳${p.price}</div>
          <button class="btn-add-cart" onclick="quickAddToCart('${p.id}')">Add to Cart</button>
        </div>
      </div>
    `).join('');
  });
}

function goToDetails(productId) {
  window.location.href = `product-details.html?id=${productId}`;
}

function quickAddToCart(productId) {
  const product = globalProductsCache.find(p => p.id === productId);
  if (!product) return;

  let cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === productId);

  if (existingIndex > -1) {
    cart[existingIndex].qty = Number(cart[existingIndex].qty || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image,
      size: 'M',
      qty: 1
    });
  }

  saveCart(cart);
  openCartDrawer();
}

function handleUserIconClick(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    const card = document.getElementById('userProfileCard');
    if (card) {
      card.style.display = (card.style.display === 'none' || card.style.display === '') ? 'block' : 'none';
    }
  }
}

function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  let resultsContainer = document.getElementById('searchResults');
  
  if (!resultsContainer) return;
  if (!query) {
    resultsContainer.innerHTML = '';
    return;
  }

  const matchedProducts = globalProductsCache.filter(p => {
    const title = (p.name || p.title || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    return title.includes(query) || category.includes(query);
  });

  if (matchedProducts.length === 0) {
    resultsContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: var(--muted-text, #888); font-size: 13px;">কোনো প্রোডাক্ট পাওয়া যায়নি</div>`;
    return;
  }

  resultsContainer.innerHTML = matchedProducts.map(p => `
    <a href="product-details.html?id=${p.id}" class="search-item" style="display:flex; align-items:center; gap:10px; padding:8px; text-decoration:none; color:inherit; border-bottom:1px solid #333;">
      <img src="${p.image}" alt="${p.name || p.title}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
      <div>
        <h4 style="font-size: 13px; font-weight: 700; margin:0 0 2px 0;">${p.name || p.title}</h4>
        <span style="font-size: 12px; font-weight: 800; color: #d90429;">৳${p.price}</span>
      </div>
    </a>
  `).join('');
}

// ৫. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderGlobalCart();
  loadCategoryProducts();

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const userIcon = document.getElementById('userIcon');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserEmail = document.getElementById('modalUserEmail');
    const modalAdminBtn = document.getElementById('modalAdminBtn');
    
    const mobileLoggedOut = document.getElementById('mobileLoggedOut');
    const mobileLoggedIn = document.getElementById('mobileLoggedIn');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail = document.getElementById('mobileUserEmail');

    if (userIcon) {
      if (user) {
        userIcon.innerHTML = `<i class="fa-solid fa-user" style="color:#2ec4b6;"></i>`;
        userIcon.onclick = handleUserIconClick;
        if (userIcon.tagName.toLowerCase() === 'a') {
          userIcon.setAttribute('href', 'javascript:void(0);');
        }
      } else {
        userIcon.innerHTML = `<i class="fa-regular fa-user"></i>`;
        if (userIcon.tagName.toLowerCase() === 'a') {
          userIcon.setAttribute('href', 'login.html');
          userIcon.onclick = null;
        } else {
          userIcon.onclick = function() { window.location.href = "login.html"; };
        }
      }
    }

    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      if (modalUserName) modalUserName.innerText = name;
      if (modalUserEmail) modalUserEmail.innerText = user.email;

      if (mobileLoggedOut) mobileLoggedOut.style.display = 'none';
      if (mobileLoggedIn) mobileLoggedIn.style.display = 'block';
      if (mobileUserName) mobileUserName.innerText = name;
      if (mobileUserEmail) mobileUserEmail.innerText = user.email;

      const isUserAdmin = (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL);
      if (modalAdminBtn) modalAdminBtn.style.display = isUserAdmin ? 'block' : 'none';
    } else {
      if (mobileLoggedOut) mobileLoggedOut.style.display = 'block';
      if (mobileLoggedIn) mobileLoggedIn.style.display = 'none';
      if (modalAdminBtn) modalAdminBtn.style.display = 'none';
    }
  });

  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartBtn) cartBtn.addEventListener('click', (e) => { e.preventDefault(); openCartDrawer(); });
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuOverlay = document.getElementById('menuOverlay');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      if (menuOverlay) menuOverlay.classList.add('open');
    });
  }

  const hideMenu = () => {
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (menuOverlay) menuOverlay.classList.remove('open');
  };

  if (closeMenuBtn) closeMenuBtn.addEventListener('click', hideMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', hideMenu);

  const searchBtn = document.getElementById('searchBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('open');
      if (searchInput) searchInput.focus();
    });
  }

  if (closeSearchBtn && searchOverlay) {
    closeSearchBtn.addEventListener('click', () => {
      searchOverlay.classList.remove('open');
      const resultsContainer = document.getElementById('searchResults');
      if (resultsContainer) resultsContainer.innerHTML = '';
      if (searchInput) searchInput.value = '';
    });
  }

  if (searchInput) searchInput.addEventListener('input', handleSearchInput);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggleBtn.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    });
  }
});

document.addEventListener('click', function(event) {
  const profileWrapper = document.querySelector('.user-profile-wrapper');
  if (profileWrapper && !profileWrapper.contains(event.target)) {
    const card = document.getElementById('userProfileCard');
    if (card) card.style.display = 'none';
  }
});

function logoutUser() {
  auth.signOut().then(() => { window.location.reload(); });
}