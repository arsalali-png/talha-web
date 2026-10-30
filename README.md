# Frame Craft - Full-Stack E-Commerce Web Application

A full-stack e-commerce web application with strictly separated **Customer** and **Administrator** portals, persistent storage in a single **`data.json`** file via Node.js `fs`, and Express backend.

---

## 🔐 Strict Role & Portal Separation

| Feature | Customer Portal | Admin Portal |
| :--- | :--- | :--- |
| **Login Route** | `/customer-login` | `/admin-login` |
| **Dashboard Route** | `/account` | `/admin-dashboard` (or `/admin`) |
| **Validation API** | `POST /api/auth/customer-login` | `POST /api/auth/admin-login` |
| **Database Key** | `customers: [...]` in `data.json` | `admin_credentials: {...}` in `data.json` |
| **Permissions** | **Read-Only**: Profile details & personal order history | **Full Control**: Add/edit/delete products, edit all website text & banners, change prices, update discount badges, view all orders |
| **Middleware** | `requireCustomerAuth` | `requireAdminAuth` (blocks customers) |

---

## 👥 Default Credentials

### Administrator
* **URL**: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)
* **Username**: `admin`
* **Password**: `admin123`
* **Features**: Full access to edit website content, manage product catalog, change prices, update discount badges, view and update orders.

### Demo Customer
* **URL**: [http://localhost:3000/customer-login](http://localhost:3000/customer-login)
* **Email**: `talha@example.com`
* **Password**: `password123`
* **Features**: Read-only personal profile, past order tracking. No website editing permissions.

---

## 🌐 Complete Route Map

### Frontend Pages
* **Storefront**: [http://localhost:3000](http://localhost:3000)
* **Customer Login & Registration**: [http://localhost:3000/customer-login](http://localhost:3000/customer-login)
* **Customer Dashboard (Profile & Orders)**: [http://localhost:3000/account](http://localhost:3000/account)
* **Admin Login**: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)
* **Admin Dashboard (Full Control)**: [http://localhost:3000/admin-dashboard](http://localhost:3000/admin-dashboard)

### Backend REST APIs
* `GET /api/site-data`: Public site content and product catalog
* `GET /api/products`: Public products list (with search & category filter)
* `POST /api/orders`: Place customer order (persisted to `data.json`)
* `POST /api/auth/customer-login`: Customer login validation
* `POST /api/auth/customer-register`: Customer registration (persisted to `data.json`)
* `GET /api/customer/profile`: Customer profile & order history (`requireCustomerAuth`)
* `POST /api/auth/admin-login`: Admin login validation
* `GET /api/admin/all-data`: Admin full data view (`requireAdminAuth`)
* `POST /api/admin/products`: Admin add product (`requireAdminAuth`)
* `PUT /api/admin/products/:id`: Admin edit product (`requireAdminAuth`)
* `DELETE /api/admin/products/:id`: Admin delete product (`requireAdminAuth`)
* `POST /api/admin/content`: Admin update text section (`requireAdminAuth`)
* `POST /api/admin/change-password`: Admin update password (`requireAdminAuth`)
* `POST /api/upload`: Admin image upload (`requireAdminAuth`)

---

## 🚀 Running the Project
```bash
# In the project directory:
node server.js
```
The application will be live at `http://localhost:3000`.
