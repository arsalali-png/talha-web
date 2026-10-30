const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'frame-' + uniqueSuffix + (ext || '.jpg'));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets from both public and root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ==========================================
// SESSION STORES (Strictly Separated)
// ==========================================
const adminSessions = new Set();
const customerSessions = new Map(); // token -> customerId

// Helper functions for reading and writing data.json dynamically using fs
function readDatabase() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading data.json:', error);
    throw new Error('Database read failure: ' + error.message);
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data.json:', error);
    throw new Error('Database write failure: ' + error.message);
  }
}

// Auth Middleware: Admin Only
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Admin authorization token required' });
  }

  const token = authHeader.replace(/^Bearer\s+/, '');
  if (!adminSessions.has(token)) {
    return res.status(403).json({ success: false, message: 'Invalid or expired admin session. Please log in at /admin-login.' });
  }

  next();
}

// Auth Middleware: Customer Only
function requireCustomerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Customer authorization token required' });
  }

  const token = authHeader.replace(/^Bearer\s+/, '');
  const customerId = customerSessions.get(token);
  if (!customerId) {
    return res.status(403).json({ success: false, message: 'Invalid or expired customer session. Please log in at /customer-login.' });
  }

  const db = readDatabase();
  const customer = (db.customers || []).find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found' });
  }

  req.customer = customer;
  next();
}

// ==========================================
// 1. PUBLIC STORE APIS
// ==========================================

// Get public website content and products
app.get('/api/site-data', (req, res) => {
  try {
    const db = readDatabase();
    res.json({
      success: true,
      siteContent: db.siteContent,
      products: db.products || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get products list with optional category & search filter
app.get('/api/products', (req, res) => {
  try {
    const db = readDatabase();
    let products = db.products || [];
    const { category, search } = req.query;

    if (category && category !== 'all') {
      if (category === 'top-selling') {
        products = products.filter(p => p.isTopSelling || p.category === 'top-selling');
      } else {
        products = products.filter(p => p.category === category);
      }
    }

    if (search) {
      const q = search.toLowerCase().trim();
      products = products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, products, total: products.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Single product details
app.get('/api/products/:id', (req, res) => {
  try {
    const db = readDatabase();
    const product = (db.products || []).find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Place customer order (persisted dynamically in data.json)
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, phone, email, address, city, items, totalAmount, paymentMethod, notes } = req.body;
    if (!customerName || !phone || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer name, phone, and cart items are required' });
    }

    const db = readDatabase();
    const newOrder = {
      id: 'ORD-' + Date.now().toString().slice(-6),
      orderDate: new Date().toISOString(),
      customerName,
      phone,
      email: email || '',
      address: address || '',
      city: city || 'Standard Delivery',
      items,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
      status: 'Pending',
      notes: notes || ''
    };

    if (!db.orders) db.orders = [];
    db.orders.unshift(newOrder);

    writeDatabase(db);

    res.json({
      success: true,
      message: 'Order placed successfully! Free Delivery applied.',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. SEPARATE AUTHENTICATION APIS
// ==========================================

// A) Dedicated Admin Login Validation Route
app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Admin username and password are required' });
    }

    const db = readDatabase();
    const adminConfig = db.admin_credentials || db.admin || { username: 'admin', password: 'admin123' };

    if (username.trim() === adminConfig.username && password === adminConfig.password) {
      const token = 'adm_' + crypto.randomBytes(24).toString('hex');
      adminSessions.add(token);
      return res.json({
        success: true,
        isAdmin: true,
        token,
        admin: {
          username: adminConfig.username,
          email: adminConfig.email || 'admin@framecraft.com'
        },
        redirect: '/admin-dashboard',
        message: 'Admin access granted'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials. Please check your username and password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// B) Dedicated Customer Login Validation Route
app.post('/api/auth/customer-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Customer email and password are required' });
    }

    const db = readDatabase();
    const customers = db.customers || [];
    const normalizedIdentifier = email.trim().toLowerCase();

    // Match customer by email or phone
    const customer = customers.find(c =>
      (c.email && c.email.toLowerCase() === normalizedIdentifier) ||
      (c.phone && c.phone.trim() === email.trim())
    );

    if (customer && customer.password === password) {
      const token = 'cust_' + crypto.randomBytes(24).toString('hex');
      customerSessions.set(token, customer.id);

      return res.json({
        success: true,
        isCustomer: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          city: customer.city || '',
          address: customer.address || ''
        },
        redirect: '/account',
        message: `Welcome back, ${customer.name}!`
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid customer email or password. You can also create an account below.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// C) Dedicated Customer Registration Route (persisted to data.json)
app.post('/api/auth/customer-register', (req, res) => {
  try {
    const { name, email, password, phone, city, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const db = readDatabase();
    if (!db.customers) db.customers = [];

    const existing = db.customers.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const newCustomer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone || '',
      city: city || '',
      address: address || '',
      joinedDate: new Date().toISOString()
    };

    db.customers.push(newCustomer);
    writeDatabase(db);

    const token = 'cust_' + crypto.randomBytes(24).toString('hex');
    customerSessions.set(token, newCustomer.id);

    res.json({
      success: true,
      token,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        city: newCustomer.city,
        address: newCustomer.address
      },
      redirect: '/account',
      message: 'Account created successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// D) Customer Profile & Orders API (Customer only)
app.get('/api/customer/profile', requireCustomerAuth, (req, res) => {
  try {
    const db = readDatabase();
    const customer = req.customer;

    // Filter customer's orders by matching email or phone
    const myOrders = (db.orders || []).filter(order =>
      (order.email && order.email.toLowerCase() === customer.email.toLowerCase()) ||
      (order.phone && order.phone === customer.phone) ||
      (order.customerName && order.customerName.toLowerCase() === customer.name.toLowerCase())
    );

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        address: customer.address,
        joinedDate: customer.joinedDate
      },
      orders: myOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// E) Customer Logout
app.post('/api/customer/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/, '');
    customerSessions.delete(token);
  }
  res.json({ success: true, message: 'Customer logged out' });
});

// Backward-compatible auth route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDatabase();
  const adminConfig = db.admin_credentials || db.admin || { username: 'admin', password: 'admin123' };

  if (username && username.trim() === adminConfig.username && password === adminConfig.password) {
    const token = 'adm_' + crypto.randomBytes(24).toString('hex');
    adminSessions.add(token);
    return res.json({
      success: true,
      isAdmin: true,
      token,
      user: { username: adminConfig.username, email: adminConfig.email || 'admin@framecraft.com' },
      redirect: '/admin-dashboard'
    });
  }

  // Check customer
  const customers = db.customers || [];
  const cust = customers.find(c => c.email.toLowerCase() === (username || '').toLowerCase() && c.password === password);
  if (cust) {
    const token = 'cust_' + crypto.randomBytes(24).toString('hex');
    customerSessions.set(token, cust.id);
    return res.json({
      success: true,
      isAdmin: false,
      token,
      user: { username: cust.name, email: cust.email },
      redirect: '/account'
    });
  }

  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ==========================================
// 3. ADMIN PORTAL PROTECTED APIS (/api/admin/*)
// ==========================================

// Verify active admin session
app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  const db = readDatabase();
  const admin = db.admin_credentials || db.admin;
  res.json({
    success: true,
    admin: {
      username: admin.username,
      email: admin.email
    }
  });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/, '');
    adminSessions.delete(token);
  }
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// Fetch all dashboard data for admin
app.get('/api/admin/all-data', requireAdminAuth, (req, res) => {
  try {
    const db = readDatabase();
    const admin = db.admin_credentials || db.admin;
    res.json({
      success: true,
      admin: {
        username: admin.username,
        email: admin.email
      },
      siteContent: db.siteContent,
      products: db.products || [],
      orders: db.orders || [],
      customers: (db.customers || []).map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, city: c.city }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Change Password and Admin Credentials (persisted to data.json)
app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newPassword, newUsername, newEmail } = req.body;
    const db = readDatabase();
    const adminKey = db.admin_credentials ? 'admin_credentials' : 'admin';

    if (currentPassword !== db[adminKey].password) {
      return res.status(400).json({ success: false, message: 'Current admin password does not match' });
    }

    if (newPassword && newPassword.trim().length >= 4) {
      db[adminKey].password = newPassword.trim();
    }
    if (newUsername && newUsername.trim().length >= 2) {
      db[adminKey].username = newUsername.trim();
    }
    if (newEmail && newEmail.trim()) {
      db[adminKey].email = newEmail.trim();
    }

    writeDatabase(db);
    res.json({
      success: true,
      message: 'Admin credentials updated successfully in data.json',
      admin: { username: db[adminKey].username, email: db[adminKey].email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update Site Content Sections (Top bar, Hero, Footer, Categories)
app.post('/api/admin/content', requireAdminAuth, (req, res) => {
  try {
    const { section, content } = req.body;
    if (!section || !content) {
      return res.status(400).json({ success: false, message: 'Section and content are required' });
    }

    const db = readDatabase();
    if (!db.siteContent) db.siteContent = {};

    db.siteContent[section] = content;
    writeDatabase(db);

    res.json({
      success: true,
      message: `Section "${section}" updated instantly in data.json`,
      siteContent: db.siteContent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update all website content in one bulk call
app.put('/api/admin/site-content', requireAdminAuth, (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ success: false, message: 'Valid content object is required' });
    }

    const db = readDatabase();
    db.siteContent = { ...db.siteContent, ...newContent };
    writeDatabase(db);

    res.json({
      success: true,
      message: 'Website content saved to data.json',
      siteContent: db.siteContent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add Product (persisted to data.json)
app.post('/api/admin/products', requireAdminAuth, (req, res) => {
  try {
    const { title, originalPrice, currentPrice, discountBadge, category, image, description, isTopSelling, inStock } = req.body;
    if (!title || currentPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Product title and price are required' });
    }

    const db = readDatabase();
    if (!db.products) db.products = [];

    let badge = discountBadge;
    const numOrig = Number(originalPrice);
    const numCurr = Number(currentPrice);
    if (!badge && numOrig > numCurr && numOrig > 0) {
      const discountPct = Math.round(((numOrig - numCurr) / numOrig) * 100);
      badge = `-${discountPct}%`;
    }

    const newProduct = {
      id: 'prod-' + Date.now(),
      title: title.trim(),
      originalPrice: numOrig || numCurr,
      currentPrice: numCurr,
      discountBadge: badge || '-25%',
      category: category || 'birthday',
      image: image || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80',
      description: description || 'High quality customized photo frame crafted with precision.',
      rating: 5.0,
      reviewsCount: 1,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      isTopSelling: Boolean(isTopSelling)
    };

    db.products.unshift(newProduct);
    writeDatabase(db);

    res.json({
      success: true,
      message: 'Product added successfully to data.json',
      product: newProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Edit Existing Product (persisted to data.json)
app.put('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const db = readDatabase();

    const idx = (db.products || []).findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let badge = updateData.discountBadge || db.products[idx].discountBadge;
    const numOrig = updateData.originalPrice !== undefined ? Number(updateData.originalPrice) : db.products[idx].originalPrice;
    const numCurr = updateData.currentPrice !== undefined ? Number(updateData.currentPrice) : db.products[idx].currentPrice;

    if (!updateData.discountBadge && numOrig > numCurr && numOrig > 0) {
      const discountPct = Math.round(((numOrig - numCurr) / numOrig) * 100);
      badge = `-${discountPct}%`;
    }

    db.products[idx] = {
      ...db.products[idx],
      ...updateData,
      originalPrice: numOrig,
      currentPrice: numCurr,
      discountBadge: badge
    };

    writeDatabase(db);
    res.json({
      success: true,
      message: 'Product updated successfully in data.json',
      product: db.products[idx]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete Product (persisted to data.json)
app.delete('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const initialLen = (db.products || []).length;
    db.products = (db.products || []).filter(p => p.id !== id);

    if (db.products.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    writeDatabase(db);
    res.json({
      success: true,
      message: 'Product deleted successfully from data.json'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Upload Image via Multer to /uploads/
app.post('/api/upload', requireAdminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: publicUrl,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update Order Status
app.patch('/api/admin/orders/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDatabase();

    const order = (db.orders || []).find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status || order.status;
    writeDatabase(db);

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. SEPARATE FRONTEND ROUTING
// ==========================================

// Helper to resolve HTML file from public/ or root
function getHtmlFile(filename) {
  const publicPath = path.join(__dirname, 'public', filename);
  if (fs.existsSync(publicPath)) return publicPath;
  return path.join(__dirname, filename);
}

// Route 1: Customer Login & Register Page
app.get('/customer-login', (req, res) => {
  res.sendFile(getHtmlFile('customer-login.html'));
});

// Route 2: Admin Login Portal
app.get('/admin-login', (req, res) => {
  res.sendFile(getHtmlFile('admin-login.html'));
});

// Route 3: Customer Portal (/account) - Profile & Orders (No Admin controls)
app.get('/account', (req, res) => {
  res.sendFile(getHtmlFile('account.html'));
});

// Route 4: Admin Dashboard (/admin-dashboard and /admin) - Full admin controls
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(getHtmlFile('admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(getHtmlFile('admin.html'));
});

// Storefront default route
app.get('/', (req, res) => {
  res.sendFile(getHtmlFile('index.html'));
});

// Global Fallback
app.get('*', (req, res) => {
  res.sendFile(getHtmlFile('index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start Server (Compatible with local and Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  FRAME CRAFT SERVER - SEPARATED ROLES ACTIVE`);
    console.log(`  Storefront:        http://localhost:${PORT}`);
    console.log(`  Customer Login:    http://localhost:${PORT}/customer-login`);
    console.log(`  Customer Portal:   http://localhost:${PORT}/account`);
    console.log(`  Admin Login:       http://localhost:${PORT}/admin-login`);
    console.log(`  Admin Dashboard:   http://localhost:${PORT}/admin-dashboard`);
    console.log(`  Database File:     ${DATA_FILE}`);
    console.log(`===============================================`);
  });
}

// Export app for Vercel serverless deployment
module.exports = app;