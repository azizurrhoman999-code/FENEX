/* FENEX MASTER JAVASCRIPT (Firebase Integrated) */

// ১. Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyA4as297Sk35tTVqSQyOUztD5Vg9sV0Oy8",
  authDomain: "fenex-ba1af.firebaseapp.com",
  projectId: "fenex-ba1af",
  storageBucket: "fenex-ba1af.firebasestorage.app",
  messagingSenderId: "506989870286",
  appId: "1:506989870286:web:75b50258542b88b443e49f"
};

// অনুমোদিত অ্যাডমিন জিমেইল (আপনার সঠিক জিমেইলটি দেওয়া হয়েছে)
const ADMIN_EMAIL = "dreamboy50700@gmail.com";

// অ্যাপ ইনিশিয়ালাইজেশন চেক
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// গ্লোবাল ভ্যারিয়েবল
let globalProductsCache = [];
let currentUser = null;

const CART_KEY = 'FENEX_CART';
const COUPON_KEY = 'FENEX_APPLIED_COUPON';

// ২. কার্ট থেকে ডাটা গেট করা
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

// ৩. কার্টে ডাটা সেভ করা
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  renderGlobalCart();
}

// ৪. কার্ট কাউন্ট আপডেট
function updateCartCount() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  document.querySelectorAll('#cartCount, #cart-count, .badge').forEach(el => {
    el.innerText = totalCount;
  });
}

// ৫. কার্ট ড্রয়ার ওপেন ও ক্লোজ
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

// ৬. ড্রয়ার কার্ট রেন্ডারিং (কুপন ডিসকাউন্টসহ)
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

  // কুপন ডিসকাউন্ট হিসাব
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

// ৭. কুপন অ্যাপ্লাই ও রিমুভ
function applyCouponCode(inputCode) {
  const code = (inputCode || '').trim().toUpperCase();
  if (code === 'FENEX10') {
    const couponData = { code: 'FENEX10', percentage: 10 };
    localStorage.setItem(COUPON_KEY, JSON.stringify(couponData));
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

// ৮. ক্যাটাগরি মেনু টগল
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

// ৯. ফায়ারবেস থেকে রিয়েল-টাইম প্রোডাক্ট লোড ফাংশন
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

// ১০. ক্যাটাগরি ফিল্টারিং ও রিয়েল-টাইম শপ গ্রিড রেন্ডার
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
    const selectedGender = urlParams.get('gender'); 
    const selectedCategory = urlParams.get('category');

    const filteredProducts = allProducts.filter(p => {
      const matchGender = !selectedGender || selectedGender === 'all' 
        || (p.gender && p.gender.trim().toLowerCase() === selectedGender.trim().toLowerCase());
        
      const matchCategory = !selectedCategory || selectedCategory === 'all' 
        || (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
        
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

// ১১. ডিটেইলস পেজে নেভিগেশন
function goToDetails(productId) {
  window.location.href = `product-details.html?id=${productId}`;
}

// ১২. কুইক অ্যাড টু কার্ট
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

// ১৩. ইউজার আইকন ক্লিক ফ্লো (পপআপ টগল লজিক)
function handleUserIconClick() {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    const card = document.getElementById('userProfileCard');
    if (card) {
      card.style.display = (card.style.display === 'none' || card.style.display === '') ? 'block' : 'none';
    }
  }
}

// ১৪. সার্চ ফিল্টার
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

// ১৫. DOM Loaded Event Listener & Auth Observer
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderGlobalCart();
  loadCategoryProducts();

  // Firebase Auth State Observer
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    const userIcon = document.getElementById('userIcon');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserEmail = document.getElementById('modalUserEmail');
    const modalAdminBtn = document.getElementById('modalAdminBtn');
    
    if (user) {
      if (userIcon) userIcon.className = "fa-solid fa-user-check";
      
      const name = user.displayName || user.email.split('@')[0];
      if (modalUserName) modalUserName.innerText = name;
      if (modalUserEmail) modalUserEmail.innerText = user.email;

      // যদি জিমেইল অ্যাডমিনের হয়
      if (user.email === ADMIN_EMAIL) {
        if (modalAdminBtn) modalAdminBtn.style.display = 'block';
      } else {
        if (modalAdminBtn) modalAdminBtn.style.display = 'none';
      }
    } else {
      if (userIcon) userIcon.className = "fa-regular fa-user";
      if (modalAdminBtn) modalAdminBtn.style.display = 'none';
    }
  });

  // Cart Drawer Handlers
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartBtn) cartBtn.addEventListener('click', (e) => { e.preventDefault(); openCartDrawer(); });
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  // Mobile Menu Handlers
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

  // Search Toggle Handlers
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

  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  // Dark Mode Toggle Handler
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeToggleBtn.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    });
  }
});

// Outside Click listener to close user popup dropdown
document.addEventListener('click', function(event) {
  const profileWrapper = document.querySelector('.user-profile-wrapper');
  if (profileWrapper && !profileWrapper.contains(event.target)) {
    const card = document.getElementById('userProfileCard');
    if (card) card.style.display = 'none';
  }
});

// Logout Function
function logoutUser() {
  auth.signOut().then(() => {
    window.location.reload();
  });
}