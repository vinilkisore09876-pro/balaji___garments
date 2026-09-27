# Balaji Garments Management System 👕

A production-quality full-stack E-Commerce & Inventory Management System for **BALAJI GARMENTS**, designed as a college DBMS project with a SaaS-level dark luxury aesthetic.

Built with **Node.js, Express.js, MongoDB Atlas (Mongoose), HTML5, CSS3, and Vanilla JavaScript**.

---

## 🌟 Key Features

1. **Dashboard Analytics & Real-Time Data**:
   - Executive statistics overview: Total Products, Total Customers, Total Sales, Total Revenue (`₹`), Total Stock, Low Stock Alerts.
   - Interactive graphs powered by **Chart.js** (Inventory Category Breakdown & Stock Analytics).
   - Recent Transactions table enriched with customer and product names.
   - Live Low Stock Widget highlighting items with stock $\le 5$.

2. **Product Catalog Management**:
   - Full CRUD operations (Create, Read, Update, Delete).
   - Live search by product name, ID, category, or color.
   - Filter by Category and Size (S, M, L, XL, XXL).
   - Sort by Price (Low-to-High / High-to-Low) and Stock level.
   - Visual status badges: `IN STOCK`, `LOW STOCK`, `OUT OF STOCK`.
   - Grid View & Data Table View toggle.

3. **Customer Registry Management**:
   - Complete customer profile management (Customer ID, Name, Phone, Email, Address).
   - Full search by name, ID, phone number, or email address.
   - Add/Edit modal dialogs with input validation.

4. **Sales & POS Billing System**:
   - Record new sales with automated calculations:
     - Real-time Product Unit Price & Stock availability display upon selection.
     - Live total calculation ($Total = Price \times Quantity$).
     - Stock validation preventing sales exceeding available inventory.
   - **Automated Inventory Reduction**: Product stock automatically decrements when a sale is completed.
   - **Stock Refund on Sale Cancellation**: Deleting a sale automatically restores the product quantity back to inventory!
   - Filter sales history by Payment Method (`UPI`, `Cash`, `Card`, `Net Banking`).

5. **Premium UI/UX Design System**:
   - Dark Luxury SaaS Aesthetic (Charcoal `#090b0e`, Glassmorphism, Metallic Gold accents `#d4af37`).
   - Reusable animated Toast Notifications.
   - Modal dialogs for forms and confirmation before destructive operations.
   - Fully responsive for Desktop, Tablet, and Mobile devices.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Custom Glassmorphic Dark Theme), Vanilla JavaScript (ES6+), FontAwesome 6, Chart.js.
- **Backend**: Node.js, Express.js (REST API Architecture).
- **Database**: MongoDB Atlas via Mongoose ODM.
- **Environment & Tools**: `dotenv`, `cors`.

---

## 📁 Project Structure

```
dbmsbalajibackend/
├── backend/
│   ├── models/
│   │   ├── Product.js       # Product Schema (product_id, name, category, size, color, price, stock)
│   │   ├── Customer.js      # Customer Schema (customer_id, name, phone, email, address)
│   │   └── Sale.js          # Sale Schema (sale_id, customer_id, product_id, quantity, total_amount, payment_method, sale_date)
│   │
│   ├── routes/
│   │   ├── products.js      # Product REST APIs
│   │   ├── customers.js     # Customer REST APIs
│   │   ├── sales.js         # Sales REST APIs & Stock Deduction Logic
│   │   └── dashboard.js     # Aggregated Analytics & Stats API
│   │
│   └── server.js            # Express Server & MongoDB Connection
│
├── frontend/
│   ├── index.html           # Main Executive Dashboard
│   ├── products.html        # Product Catalog & Inventory Page
│   ├── customers.html       # Customer Registry Page
│   ├── sales.html           # Sales Transactions & POS Page
│   ├── style.css            # Dark Theme Design System & Component Styles
│   └── script.js            # Unified Client-Side JS API Client & Modals
│
├── .env                     # MongoDB Connection String & Port (Git Ignored)
├── .gitignore               # Git Ignore Configuration
├── package.json             # Dependencies
└── README.md                # Project Documentation
```

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
- Node.js (v16+ installed)
- MongoDB Atlas cluster URI

### 2. Environment Setup
Ensure a `.env` file exists in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5001
```

### 3. Install Dependencies
Open terminal in the project directory and run:

```bash
npm install
```

### 4. Start the Application Server
Run the backend Express server:

```bash
node backend/server.js
```

Upon starting, you will see terminal confirmation:
```text
✓ Balaji Garments Server running on http://localhost:5001
==========================================
✓ Connected to MongoDB Atlas: balaji_garments
==========================================
```

### 5. Open the Frontend Application
You can open and view the website in two ways:
- **Direct Express Server**: Open [http://localhost:5001](http://localhost:5001) in your browser.
- **VS Code Live Server**: Open `frontend/index.html` with Live Server extension.

---

## 📡 REST API Documentation

### Products APIs
- `GET /api/products` - Retrieve all products
- `POST /api/products` - Add a new product (validates duplicate `product_id`)
- `GET /api/products/:id` - Fetch single product by `_id` or `product_id`
- `PUT /api/products/:id` - Update product details
- `DELETE /api/products/:id` - Remove product from inventory

### Customers APIs
- `GET /api/customers` - Retrieve all customers
- `POST /api/customers` - Register new customer (validates duplicate `customer_id`)
- `GET /api/customers/:id` - Fetch customer details
- `PUT /api/customers/:id` - Update customer record
- `DELETE /api/customers/:id` - Delete customer profile

### Sales APIs
- `GET /api/sales` - Retrieve all sales transactions enriched with customer & product names
- `POST /api/sales` - Create a new sale transaction:
  1. Validates customer and product existence.
  2. Verifies stock availability ($Quantity \le Stock$).
  3. Calculates total price ($Price \times Quantity$).
  4. Automatically deducts product stock.
- `GET /api/sales/:id` - Fetch sale details
- `PUT /api/sales/:id` - Update sale & adjust stock accordingly
- `DELETE /api/sales/:id` - Delete sale & automatically refund quantity back to stock

### Dashboard Stats API
- `GET /api/dashboard/stats` - Returns aggregated metrics: `totalProducts`, `totalCustomers`, `totalSales`, `totalRevenue`, `totalStock`, `inventoryValuation`, `lowStockProducts`, `recentSales`, and category breakdowns.

---

## 🛡️ License & Credits
Developed for **Balaji Garments** | College DBMS Final Project Demonstration.
