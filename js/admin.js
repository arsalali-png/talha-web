/**
 * FRAME CRAFT - ADMIN DASHBOARD SCRIPT
 * Manages full CRUD for products, website content, admin credentials, and orders.
 * Directly updates server data.json via Express REST APIs.
 */

(function () {
  'use strict';

  // Global Admin State
  const state = {
    token: sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || '',
    adminUser: null,
    siteContent: null,
    products: [],
    orders: [],
    categories: [],
    activeTab: 'tab-overview',
    editingProductId: null
  };

  // DOM Elements
  const DOM = {
    // Auth Screen
    authScreen: document.getElementById('admin-auth-screen'),
    dashboardLayout: document.getElementById('admin-dashboard-layout'),
    authFeedback: document.getElementById('admin-auth-feedback'),
    userInput: document.getElementById('admin-user-input'),
    passInput: document.getElementById('admin-pass-input'),

    // Sidebar & Topbar
    adminDisplayName: document.getElementById('admin-display-name'),
    sidebarProductCount: document.getElementById('sidebar-product-count'),
    sidebarOrderCount: document.getElementById('sidebar-order-count'),
    activeTabTitle: document.getElementById('active-tab-title'),

    // Metric Stats
    statTotalProducts: document.getElementById('stat-total-products'),
    statTotalOrders: document.getElementById('stat-total-orders'),
    statTotalCategories: document.getElementById('stat-total-categories'),
    statStorePhone: document.getElementById('stat-store-phone'),

    // Overview Highlights
    overviewTopbarText: document.getElementById('overview-topbar-text'),
    overviewHeroTitle: document.getElementById('overview-hero-title'),
    overviewAdminUser: document.getElementById('overview-admin-user'),
    overviewStoreEmail: document.getElementById('overview-store-email'),
    overviewProductsPreview: document.getElementById('overview-products-preview'),

    // Product Management Table
    productsTableBody: document.getElementById('admin-products-table-body'),
    productSearch: document.getElementById('admin-product-search'),
    categoryFilter: document.getElementById('admin-category-filter'),

    // Product Modal & Form
    productModal: document.getElementById('product-modal'),
    productModalTitle: document.getElementById('product-modal-title'),
    productForm: document.getElementById('product-form'),
    editProdId: document.getElementById('edit-prod-id'),
    prodTitle: document.getElementById('prod-title'),
    prodCategory: document.getElementById('prod-category'),
    prodOrigPrice: document.getElementById('prod-orig-price'),
    prodCurrPrice: document.getElementById('prod-curr-price'),
    prodBadge: document.getElementById('prod-badge'),
    badgePreview: document.getElementById('badge-preview'),
    prodImage: document.getElementById('prod-image'),
    prodImagePreview: document.getElementById('prod-image-preview'),
    prodDesc: document.getElementById('prod-desc'),
    prodTopSelling: document.getElementById('prod-top-selling'),
    prodInStock: document.getElementById('prod-in-stock'),

    // Content Management Forms
    editTopbarText: document.getElementById('edit-topbar-text'),
    editTopbarPhone: document.getElementById('edit-topbar-phone'),
    editBrandName: document.getElementById('edit-brand-name'),
    editBrandTagline: document.getElementById('edit-brand-tagline'),
    editHeroBadge: document.getElementById('edit-hero-badge'),
    editHeroTitle: document.getElementById('edit-hero-title'),
    editHeroSubtitle: document.getElementById('edit-hero-subtitle'),
    editHeroCta: document.getElementById('edit-hero-cta'),
    editHeroImage: document.getElementById('edit-hero-image'),
    heroImagePreview: document.getElementById('hero-image-preview'),
    categoriesEditorBody: document.getElementById('categories-editor-body'),

    // Footer Form
    editFooterAbout: document.getElementById('edit-footer-about'),
    editFooterPhone: document.getElementById('edit-footer-phone'),
    editFooterEmail: document.getElementById('edit-footer-email'),
    editFooterAddress: document.getElementById('edit-footer-address'),
    editSocialFb: document.getElementById('edit-social-fb'),
    editSocialIg: document.getElementById('edit-social-ig'),
    editSocialYt: document.getElementById('edit-social-yt'),
    editSocialTt: document.getElementById('edit-social-tt'),

    // Orders Table
    ordersTableBody: document.getElementById('admin-orders-table-body'),

    // Security Form
    currAdminPass: document.getElementById('curr-admin-pass'),
    newAdminUser: document.getElementById('new-admin-user'),
    newAdminEmail: document.getElementById('new-admin-email'),
    newAdminPass: document.getElementById('new-admin-pass'),
    confirmAdminPass: document.getElementById('confirm-admin-pass'),
    passwordFeedback: document.getElementById('password-feedback'),

    // Toast
    toastContainer: document.getElementById('admin-toast-container')
  };

  // Toast Notification Helper
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-solid fa-circle-check';
    if (type === 'error') icon = 'fa-solid fa-circle-exclamation';

    toast.innerHTML = `
      <i class="${icon}"></i>
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

  // Format Pakistani Rupee Currency
  function formatPrice(amount) {
    const num = Number(amount) || 0;
    return 'Rs. ' + num.toLocaleString('en-PK');
  }

  // API Request Helper with Auth Header
  async function apiRequest(endpoint, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Invalid response from server' }));

    if (res.status === 401 || res.status === 403) {
      // Session expired
      sessionStorage.removeItem('admin_token');
      state.token = '';
      showAuthScreen('Session expired. Please log in again.');
      throw new Error(data.message || 'Unauthorized');
    }

    return data;
  }

  // ==========================================================================
  // AUTHENTICATION LOGIC
  // ==========================================================================

  async function checkExistingAuth() {
    if (!state.token) {
      showAuthScreen();
      return;
    }

    try {
      const data = await apiRequest('/api/admin/verify');
      if (data.success) {
        state.adminUser = data.admin;
        hideAuthScreen();
        loadAllAdminData();
      } else {
        showAuthScreen();
      }
    } catch {
      showAuthScreen();
    }
  }

  function showAuthScreen(errorMsg = '') {
    DOM.authScreen.style.display = 'flex';
    DOM.dashboardLayout.style.display = 'none';
    if (errorMsg) {
      DOM.authFeedback.textContent = errorMsg;
      DOM.authFeedback.className = 'auth-feedback-box error';
      DOM.authFeedback.style.display = 'block';
    } else {
      DOM.authFeedback.style.display = 'none';
    }
  }

  function hideAuthScreen() {
    DOM.authScreen.style.display = 'none';
    DOM.dashboardLayout.style.display = 'flex';
  }

  async function handleAdminLogin() {
    const username = DOM.userInput.value.trim();
    const password = DOM.passInput.value.trim();

    if (!username || !password) {
      DOM.authFeedback.textContent = 'Please enter both username and password';
      DOM.authFeedback.className = 'auth-feedback-box error';
      DOM.authFeedback.style.display = 'block';
      return;
    }

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        DOM.authFeedback.textContent = data.message || 'Invalid admin credentials';
        DOM.authFeedback.className = 'auth-feedback-box error';
        DOM.authFeedback.style.display = 'block';
        return;
      }

      state.token = data.token;
      sessionStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_token', data.token);
      state.adminUser = data.user;
      sessionStorage.setItem('admin_token', data.token);

      DOM.authFeedback.textContent = 'Authenticated! Loading dashboard...';
      DOM.authFeedback.className = 'auth-feedback-box success';
      DOM.authFeedback.style.display = 'block';

      showToast('Admin logged in successfully', 'success');

      setTimeout(() => {
        hideAuthScreen();
        loadAllAdminData();
      }, 500);

    } catch (err) {
      DOM.authFeedback.textContent = 'Login error: ' + err.message;
      DOM.authFeedback.className = 'auth-feedback-box error';
      DOM.authFeedback.style.display = 'block';
    }
  }

  async function handleLogout() {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    sessionStorage.removeItem('admin_token');
    state.token = '';
    state.adminUser = null;
    showToast('Logged out of admin panel', 'info');
    showAuthScreen();
  }

  // ==========================================================================
  // LOAD & RENDER DASHBOARD DATA
  // ==========================================================================

  async function loadAllAdminData() {
    try {
      const data = await apiRequest('/api/admin/all-data');
      if (!data.success) throw new Error(data.message);

      state.adminUser = data.admin;
      state.siteContent = data.siteContent;
      state.products = data.products || [];
      state.orders = data.orders || [];
      state.categories = (data.siteContent && data.siteContent.categories) || [];

      renderDashboard();
      showToast('Synced with data.json', 'success');
    } catch (err) {
      showToast('Error loading data: ' + err.message, 'error');
    }
  }

  function renderDashboard() {
    renderHeaderAndStats();
    renderOverviewHighlights();
    renderProductsTable();
    populateContentManagementForms();
    renderOrdersTable();
  }

  function renderHeaderAndStats() {
    if (state.adminUser && DOM.adminDisplayName) {
      DOM.adminDisplayName.textContent = state.adminUser.username || 'Store Admin';
    }

    if (DOM.statTotalProducts) DOM.statTotalProducts.textContent = state.products.length;
    if (DOM.sidebarProductCount) DOM.sidebarProductCount.textContent = state.products.length;

    if (DOM.statTotalOrders) DOM.statTotalOrders.textContent = state.orders.length;
    if (DOM.sidebarOrderCount) DOM.sidebarOrderCount.textContent = state.orders.length;

    if (DOM.statTotalCategories) DOM.statTotalCategories.textContent = state.categories.length;

    if (state.siteContent && state.siteContent.topBar && DOM.statStorePhone) {
      DOM.statStorePhone.textContent = state.siteContent.topBar.phone || '+92 300 1234567';
    }
  }

  function renderOverviewHighlights() {
    if (!state.siteContent) return;
    const { topBar, hero, footer } = state.siteContent;

    if (topBar && DOM.overviewTopbarText) DOM.overviewTopbarText.textContent = topBar.announcement || '';
    if (hero && DOM.overviewHeroTitle) DOM.overviewHeroTitle.textContent = hero.title || '';
    if (state.adminUser && DOM.overviewAdminUser) DOM.overviewAdminUser.textContent = state.adminUser.username || 'admin';
    if (footer && DOM.overviewStoreEmail) DOM.overviewStoreEmail.textContent = footer.email || '';

    // Render 3 preview items
    if (DOM.overviewProductsPreview) {
      const sample = state.products.slice(0, 3);
      DOM.overviewProductsPreview.innerHTML = sample.map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${p.image}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;">
            <strong style="font-size: 0.85rem;">${p.title}</strong>
          </div>
          <span style="font-weight: 800; font-size: 0.85rem;">${formatPrice(p.currentPrice)}</span>
        </div>
      `).join('');
    }
  }

  // ==========================================================================
  // PRODUCT MANAGEMENT (ADD, EDIT, DELETE, IMAGE UPLOAD, BADGE)
  // ==========================================================================

  function renderProductsTable(filteredList = null) {
    const list = filteredList || state.products;
    if (!DOM.productsTableBody) return;

    if (!list.length) {
      DOM.productsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: #888;">
            No products found matching your filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    DOM.productsTableBody.innerHTML = list.map(prod => `
      <tr>
        <td>
          <img src="${prod.image}" alt="${prod.title}" class="prod-thumb-sm" onerror="this.src='https://via.placeholder.com/50'">
        </td>
        <td>
          <strong>${prod.title}</strong><br>
          <small style="color: #888;">ID: <code>${prod.id}</code></small>
        </td>
        <td>
          <span style="text-transform: capitalize; font-weight: 700; color: #475569;">${prod.category.replace('-', ' ')}</span>
        </td>
        <td>
          <span class="badge-pill-black">${prod.discountBadge || '-30%'}</span>
        </td>
        <td>
          <span style="text-decoration: line-through; color: #94a3b8;">${formatPrice(prod.originalPrice)}</span>
        </td>
        <td>
          <strong style="color: #0f172a;">${formatPrice(prod.currentPrice)}</strong>
        </td>
        <td>
          <span class="stock-tag ${prod.inStock ? 'stock-in' : 'stock-out'}">
            <i class="fa-solid fa-circle" style="font-size: 6px;"></i>
            ${prod.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </td>
        <td>
          <div class="table-action-btns">
            <button type="button" class="btn-icon-edit" onclick="window.adminApp.openEditProductModal('${prod.id}')" title="Edit Product">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-icon-del" onclick="window.adminApp.deleteProduct('${prod.id}')" title="Delete Product">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function filterAdminProducts() {
    const query = (DOM.productSearch.value || '').toLowerCase().trim();
    const cat = DOM.categoryFilter.value;

    let list = [...state.products];
    if (cat && cat !== 'all') {
      if (cat === 'top-selling') {
        list = list.filter(p => p.isTopSelling || p.category === 'top-selling');
      } else {
        list = list.filter(p => p.category === cat);
      }
    }

    if (query) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    renderProductsTable(list);
  }

  function openAddProductModal() {
    state.editingProductId = null;
    DOM.productModalTitle.textContent = 'Add New Product';
    DOM.productForm.reset();
    DOM.editProdId.value = '';
    DOM.prodTopSelling.checked = false;
    DOM.prodInStock.checked = true;
    DOM.prodBadge.value = '-30%';
    DOM.badgePreview.textContent = '-30%';
    DOM.prodImage.value = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80';
    DOM.prodImagePreview.src = DOM.prodImage.value;
    DOM.productModal.classList.add('active');
  }

  function openEditProductModal(productId) {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    state.editingProductId = prod.id;
    DOM.productModalTitle.textContent = `Edit Product: ${prod.title}`;
    DOM.editProdId.value = prod.id;
    DOM.prodTitle.value = prod.title;
    DOM.prodCategory.value = prod.category;
    DOM.prodOrigPrice.value = prod.originalPrice;
    DOM.prodCurrPrice.value = prod.currentPrice;
    DOM.prodBadge.value = prod.discountBadge || '-30%';
    DOM.badgePreview.textContent = prod.discountBadge || '-30%';
    DOM.prodImage.value = prod.image;
    DOM.prodImagePreview.src = prod.image;
    DOM.prodDesc.value = prod.description || '';
    DOM.prodTopSelling.checked = Boolean(prod.isTopSelling);
    DOM.prodInStock.checked = prod.inStock !== false;

    DOM.productModal.classList.add('active');
  }

  function closeProductModal() {
    DOM.productModal.classList.remove('active');
  }

  // Automatic computation of discount percentage badge from prices
  function autoComputeBadge() {
    const orig = Number(DOM.prodOrigPrice.value);
    const curr = Number(DOM.prodCurrPrice.value);
    if (orig > curr && orig > 0) {
      const pct = Math.round(((orig - curr) / orig) * 100);
      DOM.prodBadge.value = `-${pct}%`;
      DOM.badgePreview.textContent = `-${pct}%`;
    }
  }

  async function handleProductSubmit() {
    const payload = {
      title: DOM.prodTitle.value.trim(),
      category: DOM.prodCategory.value,
      originalPrice: Number(DOM.prodOrigPrice.value),
      currentPrice: Number(DOM.prodCurrPrice.value),
      discountBadge: DOM.prodBadge.value.trim(),
      image: DOM.prodImage.value.trim(),
      description: DOM.prodDesc.value.trim(),
      isTopSelling: DOM.prodTopSelling.checked,
      inStock: DOM.prodInStock.checked
    };

    try {
      let data;
      if (state.editingProductId) {
        // Update product
        data = await apiRequest(`/api/admin/products/${state.editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Add product
        data = await apiRequest('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!data.success) throw new Error(data.message);

      showToast(data.message || 'Product saved to data.json', 'success');
      closeProductModal();
      await loadAllAdminData();

    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  }

  async function deleteProduct(productId) {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    if (!confirm(`Are you sure you want to delete "${prod.title}"?\n\nThis change will immediately remove it from data.json.`)) {
      return;
    }

    try {
      const data = await apiRequest(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (!data.success) throw new Error(data.message);

      showToast(`Product deleted from data.json`, 'success');
      await loadAllAdminData();
    } catch (err) {
      alert('Error deleting product: ' + err.message);
    }
  }

  // Generic Image Uploader (Uploads to Express /api/upload and saves to public/uploads)
  async function uploadImage(inputElem, textInputId, previewImgId) {
    if (!inputElem.files || !inputElem.files[0]) return;
    const file = inputElem.files[0];

    const formData = new FormData();
    formData.append('image', file);

    try {
      showToast('Uploading image to server...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');

      if (textInputId) document.getElementById(textInputId).value = data.url;
      if (previewImgId) document.getElementById(previewImgId).src = data.url;

      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  }

  // ==========================================================================
  // CONTENT MANAGEMENT (TOP BAR, PHONE, HERO TITLE, CATEGORIES, FOOTER)
  // ==========================================================================

  function populateContentManagementForms() {
    if (!state.siteContent) return;
    const { topBar, header, hero, footer, categories } = state.siteContent;

    // Top Bar
    if (topBar) {
      DOM.editTopbarText.value = topBar.announcement || '';
      DOM.editTopbarPhone.value = topBar.phone || '';
    }

    // Header
    if (header) {
      DOM.editBrandName.value = header.brandName || '';
      DOM.editBrandTagline.value = header.tagline || '';
    }

    // Hero
    if (hero) {
      DOM.editHeroBadge.value = hero.badge || '';
      DOM.editHeroTitle.value = hero.title || '';
      DOM.editHeroSubtitle.value = hero.subtitle || '';
      DOM.editHeroCta.value = hero.ctaText || '';
      DOM.editHeroImage.value = hero.heroImage || '';
      DOM.heroImagePreview.src = hero.heroImage || '';
    }

    // Categories
    renderCategoriesEditor(categories || []);

    // Footer
    if (footer) {
      DOM.editFooterAbout.value = footer.about || '';
      DOM.editFooterPhone.value = footer.phone || '';
      DOM.editFooterEmail.value = footer.email || '';
      DOM.editFooterAddress.value = footer.address || '';
      if (footer.socials) {
        DOM.editSocialFb.value = footer.socials.facebook || '';
        DOM.editSocialIg.value = footer.socials.instagram || '';
        DOM.editSocialYt.value = footer.socials.youtube || '';
        DOM.editSocialTt.value = footer.socials.tiktok || '';
      }
    }
  }

  function renderCategoriesEditor(categories) {
    if (!DOM.categoriesEditorBody) return;
    DOM.categoriesEditorBody.innerHTML = categories.map((cat, idx) => `
      <tr data-cat-idx="${idx}">
        <td>
          <input type="text" class="cat-input-id" value="${cat.id}" style="width: 140px; font-weight: 700;">
        </td>
        <td>
          <input type="text" class="cat-input-name" value="${cat.name}" style="font-weight: 700;">
        </td>
        <td>
          <input type="text" class="cat-input-desc" value="${cat.description || ''}">
        </td>
        <td>
          <button type="button" class="btn-icon-del" onclick="window.adminApp.removeCategoryRow(${idx})" title="Remove category">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function addNewCategoryRow() {
    const table = DOM.categoriesEditorBody;
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" class="cat-input-id" placeholder="e.g. acrylic-frame" style="width: 140px; font-weight: 700;"></td>
      <td><input type="text" class="cat-input-name" placeholder="Display Name" style="font-weight: 700;"></td>
      <td><input type="text" class="cat-input-desc" placeholder="Brief category description"></td>
      <td>
        <button type="button" class="btn-icon-del" onclick="this.closest('tr').remove()" title="Remove category">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    table.appendChild(newRow);
  }

  function removeCategoryRow(index) {
    const rows = DOM.categoriesEditorBody.querySelectorAll('tr');
    if (rows[index]) rows[index].remove();
  }

  async function saveCategories() {
    const rows = DOM.categoriesEditorBody.querySelectorAll('tr');
    const newCategories = [];

    rows.forEach(row => {
      const id = row.querySelector('.cat-input-id').value.trim();
      const name = row.querySelector('.cat-input-name').value.trim();
      const desc = row.querySelector('.cat-input-desc').value.trim();
      if (id && name) {
        newCategories.push({ id, name, description: desc });
      }
    });

    if (!newCategories.length) {
      alert('Please have at least one category!');
      return;
    }

    try {
      const data = await apiRequest('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({
          section: 'categories',
          content: newCategories
        })
      });

      if (!data.success) throw new Error(data.message);
      showToast('Categories updated in data.json', 'success');
      await loadAllAdminData();
    } catch (err) {
      alert('Error updating categories: ' + err.message);
    }
  }

  async function saveSection(sectionName) {
    let contentPayload = null;

    if (sectionName === 'topBar') {
      contentPayload = {
        announcement: DOM.editTopbarText.value.trim(),
        phone: DOM.editTopbarPhone.value.trim()
      };
    } else if (sectionName === 'header') {
      contentPayload = {
        brandName: DOM.editBrandName.value.trim(),
        tagline: DOM.editBrandTagline.value.trim()
      };
    } else if (sectionName === 'hero') {
      contentPayload = {
        badge: DOM.editHeroBadge.value.trim(),
        title: DOM.editHeroTitle.value.trim(),
        subtitle: DOM.editHeroSubtitle.value.trim(),
        ctaText: DOM.editHeroCta.value.trim(),
        ctaLink: '#products-section',
        heroImage: DOM.editHeroImage.value.trim()
      };
    } else if (sectionName === 'footer') {
      contentPayload = {
        about: DOM.editFooterAbout.value.trim(),
        phone: DOM.editFooterPhone.value.trim(),
        email: DOM.editFooterEmail.value.trim(),
        address: DOM.editFooterAddress.value.trim(),
        socials: {
          facebook: DOM.editSocialFb.value.trim(),
          instagram: DOM.editSocialIg.value.trim(),
          youtube: DOM.editSocialYt.value.trim(),
          tiktok: DOM.editSocialTt.value.trim()
        }
      };
    }

    try {
      const data = await apiRequest('/api/admin/content', {
        method: 'POST',
        body: JSON.stringify({
          section: sectionName,
          content: contentPayload
        })
      });

      if (!data.success) throw new Error(data.message);
      showToast(`Section "${sectionName}" saved instantly to data.json!`, 'success');
      await loadAllAdminData();
    } catch (err) {
      alert(`Error updating ${sectionName}: ` + err.message);
    }
  }

  async function saveAllContent() {
    try {
      await saveSection('topBar');
      await saveSection('header');
      await saveSection('hero');
      await saveCategories();
      await saveSection('footer');
      showToast('All website text sections saved to data.json!', 'success');
    } catch (err) {
      alert('Error saving all content: ' + err.message);
    }
  }

  // ==========================================================================
  // ORDERS MANAGEMENT
  // ==========================================================================

  function renderOrdersTable() {
    if (!DOM.ordersTableBody) return;

    if (!state.orders.length) {
      DOM.ordersTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 30px; color: #888;">
            No customer orders placed yet. Orders made via storefront will appear here.
          </td>
        </tr>
      `;
      return;
    }

    DOM.ordersTableBody.innerHTML = state.orders.map(o => {
      const dateFormatted = new Date(o.orderDate).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' });
      const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.title}`).join(', ');

      return `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td style="font-size: 0.8rem; color: #64748b;">${dateFormatted}</td>
          <td><strong>${o.customerName}</strong></td>
          <td><code>${o.phone}</code></td>
          <td style="font-size: 0.85rem;">${o.city} (${o.address})</td>
          <td style="font-size: 0.82rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">
            ${itemsSummary}
          </td>
          <td><strong>${formatPrice(o.totalAmount)}</strong></td>
          <td>
            <span class="stock-tag ${o.status === 'Delivered' ? 'stock-in' : 'stock-out'}">
              ${o.status || 'Pending'}
            </span>
          </td>
          <td>
            <select onchange="window.adminApp.updateOrderStatus('${o.id}', this.value)" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px;">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const data = await apiRequest(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (!data.success) throw new Error(data.message);
      showToast(`Order status updated to ${newStatus}`, 'success');
      await loadAllAdminData();
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  }

  // ==========================================================================
  // SECURITY & CREDENTIALS (CHANGE ADMIN PASSWORD)
  // ==========================================================================

  async function handleChangePassword() {
    const currentPassword = DOM.currAdminPass.value.trim();
    const newPassword = DOM.newAdminPass.value.trim();
    const confirmPassword = DOM.confirmAdminPass.value.trim();
    const newUsername = DOM.newAdminUser.value.trim();
    const newEmail = DOM.newAdminEmail.value.trim();

    if (!currentPassword) {
      showPassFeedback('Please enter your current admin password', 'error');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      showPassFeedback('New password must be at least 4 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showPassFeedback('New password and confirmation do not match', 'error');
      return;
    }

    try {
      const payload = {
        currentPassword,
        newPassword: newPassword || undefined,
        newUsername: newUsername || undefined,
        newEmail: newEmail || undefined
      };

      const data = await apiRequest('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!data.success) throw new Error(data.message);

      showPassFeedback('Admin credentials updated successfully in data.json!', 'success');
      showToast('Admin password changed and persisted to data.json!', 'success');
      DOM.currAdminPass.value = '';
      DOM.newAdminPass.value = '';
      DOM.confirmAdminPass.value = '';
      await loadAllAdminData();

    } catch (err) {
      showPassFeedback(err.message, 'error');
    }
  }

  function showPassFeedback(msg, type) {
    if (!DOM.passwordFeedback) return;
    DOM.passwordFeedback.className = `auth-feedback-box ${type}`;
    DOM.passwordFeedback.textContent = msg;
    DOM.passwordFeedback.style.display = 'block';
  }

  // ==========================================================================
  // TAB NAVIGATION & UTILITIES
  // ==========================================================================

  function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle Tab Buttons in Sidebar
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Toggle Panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Update Breadcrumb Title
    const titleMap = {
      'tab-overview': 'Dashboard Overview',
      'tab-products': 'Product Management',
      'tab-content': 'Content Management',
      'tab-orders': 'Customer Orders',
      'tab-security': 'Admin Credentials'
    };
    if (DOM.activeTabTitle) DOM.activeTabTitle.textContent = titleMap[tabId] || 'Dashboard';

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
  }

  function toggleMobileSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.toggle('mobile-open');
  }

  function togglePass(inputId) {
    const elem = document.getElementById(inputId);
    if (elem) elem.type = elem.type === 'password' ? 'text' : 'password';
  }

  function refreshData() {
    loadAllAdminData();
  }

  // Bind Sidebar Nav Buttons
  function initNavEvents() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Listen to image url change for live preview
    if (DOM.prodImage) {
      DOM.prodImage.addEventListener('input', (e) => {
        if (DOM.prodImagePreview) DOM.prodImagePreview.src = e.target.value;
      });
    }

    if (DOM.editHeroImage) {
      DOM.editHeroImage.addEventListener('input', (e) => {
        if (DOM.heroImagePreview) DOM.heroImagePreview.src = e.target.value;
      });
    }
  }

  // Initialize
  function init() {
    initNavEvents();
    checkExistingAuth();
  }

  // Expose methods to global window.adminApp
  window.adminApp = {
    init,
    handleAdminLogin,
    handleLogout,
    switchTab,
    toggleMobileSidebar,
    togglePass,
    refreshData,
    filterAdminProducts,
    openAddProductModal,
    openEditProductModal,
    closeProductModal,
    handleProductSubmit,
    deleteProduct,
    autoComputeBadge,
    uploadImage,
    saveSection,
    saveAllContent,
    addNewCategoryRow,
    removeCategoryRow,
    saveCategories,
    updateOrderStatus,
    handleChangePassword
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
