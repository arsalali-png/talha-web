/**
 * FRAME CRAFT - STOREFRONT APPLICATION SCRIPT
 * Full-stack e-commerce frontend communicating dynamically with Node.js Express & data.json
 */

(function () {
  'use strict';

  // Global State
  const state = {
    siteContent: null,
    products: [],
    filteredProducts: [],
    currentCategory: 'all',
    searchQuery: '',
    sortBy: 'featured',
    cart: [],
    currentUser: null
  };

  // DOM Elements
  const DOM = {
    // Top Bar
    topBarText: document.getElementById('topBar-text'),
    topBarPhone: document.getElementById('topBar-phone'),
    topBarPhoneLink: document.getElementById('topBar-phone-link'),
    
    // Header
    brandName: document.getElementById('header-brandName'),
    brandTagline: document.getElementById('header-tagline'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    cartCount: document.getElementById('cart-item-count'),
    cartTotalPrice: document.getElementById('cart-total-price'),
    userGreetingLabel: document.getElementById('user-greeting-label'),

    // Navigation
    navMenuList: document.getElementById('nav-menu-list'),

    // Hero Section
    heroBadge: document.getElementById('hero-badge'),
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    heroImage: document.getElementById('hero-image'),
    heroCtaBtn: document.getElementById('hero-cta-btn'),

    // Categories & Products
    categoryTabsContainer: document.getElementById('category-tabs-container'),
    currentCategoryHeading: document.getElementById('current-category-heading'),
    currentCategoryDesc: document.getElementById('current-category-desc'),
    productsCountLabel: document.getElementById('products-count-label'),
    activeSearchIndicator: document.getElementById('active-search-indicator'),
    searchQueryDisplay: document.getElementById('search-query-display'),
    productsGrid: document.getElementById('products-grid'),
    noProductsState: document.getElementById('no-products-state'),

    // Footer
    footerCategoriesList: document.getElementById('footer-categories-list'),
    footerQuickLinks: document.getElementById('footer-quick-links'),
    footerAddress: document.getElementById('footer-address'),
    footerPhone: document.getElementById('footer-phone'),
    footerEmail: document.getElementById('footer-email'),
    footerBrandName: document.getElementById('footer-brand-name'),

    // Login Drawer
    loginDrawer: document.getElementById('login-drawer'),
    loginOverlay: document.getElementById('login-drawer-overlay'),
    openLoginBtn: document.getElementById('open-login-drawer'),
    closeLoginBtn: document.getElementById('close-login-drawer'),
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginFeedback: document.getElementById('login-feedback'),

    // Cart Drawer
    cartDrawer: document.getElementById('cart-drawer'),
    cartOverlay: document.getElementById('cart-drawer-overlay'),
    openCartBtn: document.getElementById('open-cart-drawer'),
    closeCartBtn: document.getElementById('close-cart-drawer'),
    cartItemsList: document.getElementById('cart-items-list'),
    emptyCartView: document.getElementById('empty-cart-view'),
    cartDrawerItemsCount: document.getElementById('cart-drawer-items-count'),
    cartSubtotalPrice: document.getElementById('cart-subtotal-price'),
    cartGrandTotal: document.getElementById('cart-grand-total'),
    checkoutTotalDisplay: document.getElementById('checkout-total-display'),

    // Checkout Modal
    checkoutModal: document.getElementById('checkout-modal'),
    checkoutForm: document.getElementById('checkout-form'),

    // Quick View Modal
    quickViewModal: document.getElementById('quick-view-modal'),
    quickViewContainer: document.getElementById('quick-view-container'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // Format Pakistani Rupee Currency
  function formatPrice(amount) {
    const num = Number(amount) || 0;
    return 'Rs. ' + num.toLocaleString('en-PK');
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
    if (type === 'yellow') iconClass = 'fa-solid fa-bell';

    toast.innerHTML = `
      <i class="${iconClass}"></i>
      <span>${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Fetch Public Site Data from Node.js Express server
  async function fetchSiteData() {
    try {
      const res = await fetch('/api/site-data');
      if (!res.ok) throw new Error('Failed to fetch store data');
      const data = await res.json();

      if (data.success) {
        state.siteContent = data.siteContent;
        state.products = data.products || [];
        renderAll();
      }
    } catch (err) {
      console.error('API Error:', err);
      showToast('Could not sync with data.json: ' + err.message, 'error');
    }
  }

  // Render everything on the website from the loaded siteContent and products
  function renderAll() {
    renderSiteContent();
    renderCategoriesTabs();
    applyFiltersAndRenderProducts();
    updateCartUI();
  }

  // 1. Render Website Text Sections (Dynamic from data.json)
  function renderSiteContent() {
    if (!state.siteContent) return;
    const { topBar, header, hero, footer, navigation } = state.siteContent;

    // Top Bar
    if (topBar) {
      if (DOM.topBarText) DOM.topBarText.textContent = topBar.announcement || 'Free Delivery on All Frames';
      if (DOM.topBarPhone) DOM.topBarPhone.textContent = topBar.phone || '+92 300 1234567';
      if (DOM.topBarPhoneLink) DOM.topBarPhoneLink.href = `tel:${(topBar.phone || '').replace(/\s+/g, '')}`;
    }

    // Header
    if (header) {
      if (DOM.brandName) DOM.brandName.textContent = header.brandName || 'FRAME CRAFT';
      if (DOM.brandTagline) DOM.brandTagline.textContent = header.tagline || 'CUSTOMIZED FRAMES';
    }

    // Hero Section
    if (hero) {
      if (DOM.heroTitle) DOM.heroTitle.textContent = hero.title || 'CUSTOMIZED FRAMES FOR YOU';
      if (DOM.heroSubtitle) DOM.heroSubtitle.textContent = hero.subtitle || '';
      if (DOM.heroBadge && hero.badge) {
        DOM.heroBadge.innerHTML = `<i class="fa-solid fa-sparkles"></i> <span>${hero.badge}</span>`;
      }
      if (DOM.heroImage && hero.heroImage) {
        DOM.heroImage.src = hero.heroImage;
      }
      if (DOM.heroCtaBtn && hero.ctaText) {
        DOM.heroCtaBtn.innerHTML = `<span>${hero.ctaText}</span> <i class="fa-solid fa-arrow-right-long"></i>`;
      }
    }

    // Navigation Menu links
    if (navigation && Array.isArray(navigation) && DOM.navMenuList) {
      DOM.navMenuList.innerHTML = navigation.map(nav => {
        const cat = nav.category || 'all';
        return `
          <li class="nav-item">
            <a href="${nav.target || '#products-section'}" 
               class="nav-link ${state.currentCategory === cat ? 'active' : ''}" 
               data-category="${cat}"
               onclick="window.app.filterByCategory('${cat}')">
              ${nav.label}
            </a>
          </li>
        `;
      }).join('');
    }

    // Footer
    if (footer) {
      if (DOM.footerAddress) DOM.footerAddress.textContent = footer.address || '';
      if (DOM.footerPhone) {
        DOM.footerPhone.textContent = footer.phone || '';
        DOM.footerPhone.href = `tel:${(footer.phone || '').replace(/\s+/g, '')}`;
      }
      if (DOM.footerEmail) {
        DOM.footerEmail.textContent = footer.email || '';
        DOM.footerEmail.href = `mailto:${footer.email || ''}`;
      }
      if (DOM.footerBrandName && header) {
        DOM.footerBrandName.textContent = header.brandName || 'FRAME CRAFT';
      }
    }
  }

  // 2. Render Category Filter Tabs
  function renderCategoriesTabs() {
    if (!state.siteContent || !state.siteContent.categories || !DOM.categoryTabsContainer) return;
    
    const categories = state.siteContent.categories;
    DOM.categoryTabsContainer.innerHTML = categories.map(cat => {
      const isActive = state.currentCategory === cat.id;
      return `
        <button 
          type="button" 
          class="cat-tab-btn ${isActive ? 'active' : ''}" 
          onclick="window.app.filterByCategory('${cat.id}')"
        >
          <span>${cat.name}</span>
        </button>
      `;
    }).join('');
  }

  // 3. Filter and Sort Products
  function applyFiltersAndRenderProducts() {
    let list = [...state.products];

    // Category filter
    if (state.currentCategory && state.currentCategory !== 'all') {
      if (state.currentCategory === 'top-selling') {
        list = list.filter(p => p.isTopSelling || p.category === 'top-selling');
      } else {
        list = list.filter(p => p.category === state.currentCategory);
      }
    }

    // Search query filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );

      DOM.activeSearchIndicator.style.display = 'flex';
      DOM.searchQueryDisplay.textContent = `"${state.searchQuery}"`;
      DOM.clearSearchBtn.style.display = 'flex';
    } else {
      DOM.activeSearchIndicator.style.display = 'none';
      DOM.clearSearchBtn.style.display = 'none';
    }

    // Sorting
    if (state.sortBy === 'price-low') {
      list.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (state.sortBy === 'price-high') {
      list.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (state.sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = a.originalPrice ? ((a.originalPrice - a.currentPrice) / a.originalPrice) : 0;
        const discB = b.originalPrice ? ((b.originalPrice - b.currentPrice) / b.originalPrice) : 0;
        return discB - discA;
      });
    }

    state.filteredProducts = list;
    renderProductsGrid(list);
    updateCategoryHeaderInfo();
  }

  // Update Section Heading based on category
  function updateCategoryHeaderInfo() {
    const categories = (state.siteContent && state.siteContent.categories) || [];
    const activeCat = categories.find(c => c.id === state.currentCategory) || {
      name: 'All Customized Frames',
      description: 'Explore our complete collection of personalized frames, LED magic mirrors, and memorable gifts.'
    };

    DOM.currentCategoryHeading.textContent = activeCat.name;
    DOM.currentCategoryDesc.textContent = activeCat.description || 'Handcrafted customized photo frames & LED mirrors.';
    DOM.productsCountLabel.textContent = `Showing ${state.filteredProducts.length} Product${state.filteredProducts.length === 1 ? '' : 's'}`;
  }

  // 4. Render Product Grid Cards
  // CRUCIAL REQUIREMENT:
  // - Black circular discount badge (e.g. '-33%') on top left of image
  // - Product title
  // - Greyed-out strikethrough original price
  // - Bold current price
  // - Yellow 'Add to cart' button
  function renderProductsGrid(products) {
    if (!DOM.productsGrid) return;

    if (!products.length) {
      DOM.productsGrid.innerHTML = '';
      DOM.noProductsState.style.display = 'block';
      return;
    }

    DOM.noProductsState.style.display = 'none';

    DOM.productsGrid.innerHTML = products.map(product => {
      // Calculate or extract discount badge (e.g. "-33%")
      let badgeText = product.discountBadge;
      if (!badgeText && product.originalPrice > product.currentPrice) {
        const pct = Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
        badgeText = `-${pct}%`;
      }
      if (!badgeText) badgeText = '-30%';

      const categoryName = getCategoryLabel(product.category);

      return `
        <article class="product-card" data-product-id="${product.id}">
          <!-- Image with Black Circular Discount Badge -->
          <div class="product-image-container" onclick="window.app.openQuickView('${product.id}')">
            <!-- Black circular discount badge on top left of image -->
            <div class="product-discount-badge">${badgeText}</div>
            
            <img 
              src="${product.image || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80'}" 
              alt="${product.title}" 
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80'"
            >

            <button type="button" class="product-quick-btn" title="Quick View" aria-label="Quick View">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>

          <!-- Product Info -->
          <div class="product-info-wrap">
            <span class="product-category-tag">${categoryName}</span>

            <!-- Product Title -->
            <h3 class="product-title" onclick="window.app.openQuickView('${product.id}')">
              ${product.title}
            </h3>

            <!-- Pricing Row: Greyed-out strikethrough original price & bold current price -->
            <div class="product-pricing-row">
              <span class="product-original-price">${formatPrice(product.originalPrice)}</span>
              <span class="product-current-price">${formatPrice(product.currentPrice)}</span>
            </div>

            <!-- Yellow 'Add to cart' button -->
            <button 
              type="button" 
              class="btn-add-to-cart" 
              onclick="window.app.addToCart('${product.id}')"
            >
              <i class="fa-solid fa-cart-plus"></i>
              <span>Add to cart</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function getCategoryLabel(catId) {
    if (!state.siteContent || !state.siteContent.categories) return 'Custom Frame';
    const match = state.siteContent.categories.find(c => c.id === catId);
    return match ? match.name : 'Custom Frame';
  }

  // ==========================================================================
  // CART LOGIC & DRAWER MANAGEMENT
  // ==========================================================================

  function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: product.currentPrice,
        image: product.image,
        quantity: 1
      });
    }

    updateCartUI();
    showToast(`Added "${product.title}" to cart!`, 'yellow');

    // Optional subtle bounce animation on header cart button
    if (DOM.openCartBtn) {
      DOM.openCartBtn.style.transform = 'scale(1.08)';
      setTimeout(() => DOM.openCartBtn.style.transform = '', 200);
    }
  }

  function changeCartQuantity(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateCartUI();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    updateCartUI();
    showToast('Item removed from cart', 'info');
  }

  function clearCart() {
    state.cart = [];
    updateCartUI();
    showToast('Cart emptied', 'info');
  }

  function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update Header Counter
    if (DOM.cartCount) DOM.cartCount.textContent = totalItems;
    if (DOM.cartTotalPrice) DOM.cartTotalPrice.textContent = formatPrice(totalPrice);
    if (DOM.cartDrawerItemsCount) DOM.cartDrawerItemsCount.textContent = totalItems;
    if (DOM.cartSubtotalPrice) DOM.cartSubtotalPrice.textContent = formatPrice(totalPrice);
    if (DOM.cartGrandTotal) DOM.cartGrandTotal.textContent = formatPrice(totalPrice);
    if (DOM.checkoutTotalDisplay) DOM.checkoutTotalDisplay.textContent = formatPrice(totalPrice);

    // Render items list in Cart Drawer
    if (!state.cart.length) {
      DOM.cartItemsList.style.display = 'none';
      DOM.emptyCartView.style.display = 'flex';
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      DOM.cartItemsList.style.display = 'flex';
      DOM.emptyCartView.style.display = 'none';
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) checkoutBtn.disabled = false;

      DOM.cartItemsList.innerHTML = state.cart.map(item => `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${item.title}" class="cart-item-thumb">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="cart-item-qty-controls">
              <button type="button" class="qty-btn" onclick="window.app.changeCartQuantity('${item.id}', -1)">-</button>
              <span class="qty-count">${item.quantity}</span>
              <button type="button" class="qty-btn" onclick="window.app.changeCartQuantity('${item.id}', 1)">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove-btn" onclick="window.app.removeFromCart('${item.id}')" title="Remove item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `).join('');
    }
  }

  function openCartDrawer() {
    DOM.cartDrawer.classList.add('active');
    DOM.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    DOM.cartDrawer.classList.remove('active');
    DOM.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // LOGIN DRAWER (Right-side sliding panel for Sign In)
  // ==========================================================================

  function openLoginDrawer() {
    DOM.loginDrawer.classList.add('active');
    DOM.loginOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (DOM.loginUsername) DOM.loginUsername.focus();
  }

  function closeLoginDrawer() {
    DOM.loginDrawer.classList.remove('active');
    DOM.loginOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  async function handleLogin() {
    const username = DOM.loginUsername.value.trim();
    const password = DOM.loginPassword.value.trim();

    if (!username || !password) {
      showLoginFeedback('Please enter both username and password', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showLoginFeedback(data.message || 'Login failed', 'error');
        return;
      }

      // Check if Admin
      if (data.isAdmin) {
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_user', JSON.stringify(data.user));
        showLoginFeedback('Admin authenticated! Redirecting to Admin Panel...', 'success');
        showToast('Admin Logged In! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 800);
        return;
      }

      // Customer Login
      state.currentUser = data.user;
      DOM.userGreetingLabel.textContent = `Hello, ${data.user.username.split('@')[0]}`;
      showLoginFeedback('Logged in successfully!', 'success');
      showToast(`Welcome back, ${data.user.username}!`, 'success');
      setTimeout(() => {
        closeLoginDrawer();
      }, 700);

    } catch (err) {
      showLoginFeedback('Network error: ' + err.message, 'error');
    }
  }

  function simulateGoogleLogin() {
    const demoUser = { username: 'Google User', email: 'user@gmail.com' };
    state.currentUser = demoUser;
    DOM.userGreetingLabel.textContent = 'Hello, Google User';
    showToast('Signed in with Google Account', 'success');
    closeLoginDrawer();
  }

  function showLoginFeedback(msg, type) {
    if (!DOM.loginFeedback) return;
    DOM.loginFeedback.className = `auth-feedback ${type}`;
    DOM.loginFeedback.textContent = msg;
    DOM.loginFeedback.style.display = 'block';
  }

  function toggleCreateAccount(e) {
    e.preventDefault();
    alert('Account registration is enabled! You can sign in directly or sign in with Google. For store administrator, use username "admin" and password "admin123".');
  }

  function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  // ==========================================================================
  // CHECKOUT & ORDERS (Persisted to data.json)
  // ==========================================================================

  function openCheckoutModal() {
    if (!state.cart.length) {
      showToast('Your cart is empty', 'error');
      return;
    }
    closeCartDrawer();
    DOM.checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    DOM.checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  async function submitOrder() {
    const customerName = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const email = document.getElementById('order-email').value.trim();
    const address = document.getElementById('order-address').value.trim();
    const city = document.getElementById('order-city').value.trim();
    const paymentMethod = document.getElementById('order-payment').value;
    const notes = document.getElementById('order-notes').value.trim();

    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const payload = {
      customerName,
      phone,
      email,
      address,
      city,
      paymentMethod,
      notes,
      totalAmount,
      items: state.cart
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Order submission failed');
      }

      showToast(`Order #${data.order.id} placed successfully! Free Delivery applied.`, 'success');
      alert(`Thank you, ${customerName}!\n\nYour order #${data.order.id} for ${formatPrice(totalAmount)} has been placed successfully and saved to data.json!\n\nWe will contact you on WhatsApp / Phone: ${phone} to confirm frame customization details.`);
      
      state.cart = [];
      updateCartUI();
      closeCheckoutModal();
      DOM.checkoutForm.reset();

    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  }

  // ==========================================================================
  // PRODUCT QUICK VIEW MODAL
  // ==========================================================================

  function openQuickView(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    let badgeText = product.discountBadge || '-33%';
    const categoryName = getCategoryLabel(product.category);

    DOM.quickViewContainer.innerHTML = `
      <div class="quick-view-grid">
        <div class="quick-view-img">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="quick-view-details">
          <span class="product-category-tag">${categoryName}</span>
          <h2 style="font-size: 1.5rem; font-weight: 900; line-height: 1.2;">${product.title}</h2>
          
          <div class="product-pricing-row" style="margin-bottom: 8px;">
            <span class="product-original-price" style="font-size: 1.1rem;">${formatPrice(product.originalPrice)}</span>
            <span class="product-current-price" style="font-size: 1.6rem;">${formatPrice(product.currentPrice)}</span>
            <span class="product-discount-badge" style="position: static; width: auto; height: auto; padding: 4px 10px; border-radius: 9999px;">${badgeText}</span>
          </div>

          <p style="font-size: 0.95rem; color: #555; line-height: 1.6;">${product.description || 'Premium customized frame crafted with solid wood and crystal glass.'}</p>

          <div style="background: #fff8d6; padding: 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
            <i class="fa-solid fa-circle-check" style="color: #eab308;"></i> Free Express Delivery Nationwide included on this frame!
          </div>

          <div style="margin-top: 12px;">
            <button 
              type="button" 
              class="btn-add-to-cart" 
              onclick="window.app.addToCart('${product.id}'); window.app.closeQuickView(); window.app.openCartDrawer();"
            >
              <i class="fa-solid fa-cart-plus"></i>
              <span>Add to Cart & Checkout</span>
            </button>
          </div>
        </div>
      </div>
    `;

    DOM.quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    DOM.quickViewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // SEARCH & CATEGORY FILTER ACTIONS
  // ==========================================================================

  function filterByCategory(categoryId) {
    state.currentCategory = categoryId;
    
    // Update active state in nav menu and category tabs
    document.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim().toLowerCase().includes(categoryId.replace('-', ' ')));
    });

    renderCategoriesTabs();
    applyFiltersAndRenderProducts();

    // Smooth scroll to products section
    const sec = document.getElementById('products-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSearch() {
    state.searchQuery = DOM.searchInput.value.trim();
    applyFiltersAndRenderProducts();
    const sec = document.getElementById('products-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }

  function clearSearch() {
    state.searchQuery = '';
    DOM.searchInput.value = '';
    applyFiltersAndRenderProducts();
  }

  function handleSort(sortValue) {
    state.sortBy = sortValue;
    applyFiltersAndRenderProducts();
  }

  function resetFilters() {
    state.currentCategory = 'all';
    state.searchQuery = '';
    DOM.searchInput.value = '';
    renderCategoriesTabs();
    applyFiltersAndRenderProducts();
  }

  // Setup Event Listeners
  function initEvents() {
    // Search input instant filter with debounce
    if (DOM.searchInput) {
      let debounceTimer;
      DOM.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = e.target.value.trim();
          applyFiltersAndRenderProducts();
        }, 250);
      });
    }

    if (DOM.clearSearchBtn) {
      DOM.clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Customer authentication state check for My Account link
    const customerToken = localStorage.getItem('customer_token');
    const customerInfo = JSON.parse(localStorage.getItem('customer_info') || 'null');
    if (customerToken && customerInfo && DOM.openLoginBtn) {
      DOM.openLoginBtn.href = '/account';
      if (DOM.userGreetingLabel) DOM.userGreetingLabel.textContent = `Hello, ${customerInfo.name.split(' ')[0]}`;
    }

    if (DOM.closeLoginBtn) DOM.closeLoginBtn.addEventListener('click', closeLoginDrawer);
    if (DOM.loginOverlay) DOM.loginOverlay.addEventListener('click', closeLoginDrawer);

    if (DOM.openCartBtn) DOM.openCartBtn.addEventListener('click', openCartDrawer);
    if (DOM.closeCartBtn) DOM.closeCartBtn.addEventListener('click', closeCartDrawer);
    if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', closeCartDrawer);

    // Escape key closes open drawers/modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLoginDrawer();
        closeCartDrawer();
        closeCheckoutModal();
        closeQuickView();
      }
    });
  }

  // Initialize
  function init() {
    initEvents();
    fetchSiteData();
  }

  // Expose public API to global window.app
  window.app = {
    init,
    fetchSiteData,
    filterByCategory,
    handleSearch,
    clearSearch,
    handleSort,
    resetFilters,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    openCartDrawer,
    closeCartDrawer,
    openLoginDrawer,
    closeLoginDrawer,
    handleLogin,
    simulateGoogleLogin,
    toggleCreateAccount,
    togglePasswordVisibility,
    openCheckoutModal,
    closeCheckoutModal,
    submitOrder,
    openQuickView,
    closeQuickView
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
