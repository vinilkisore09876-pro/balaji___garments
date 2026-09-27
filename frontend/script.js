/* ==========================================================================
   BALAJI GARMENTS - FULL-STACK CORE FRONTEND APPLICATION SCRIPT
   ========================================================================== */

const API_BASE = window.location.origin.startsWith("http")
    ? (window.location.port === "5001" ? "/api" : "http://localhost:5001/api")
    : "http://localhost:5001/api";

// Global Shared State
const state = {
    products: [],
    customers: [],
    sales: [],
    dashboard: null,
    deleteCallback: null,
    revenueChart: null,
    categoryChart: null,
    editingProductId: null,
    editingCustomerId: null,
    editingSaleId: null
};

// ==========================================================================
// UTILITY FUNCTIONS & TOAST NOTIFICATION SYSTEM
// ==========================================================================

function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return "₹" + num.toLocaleString("en-IN");
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// Toast Notification Manager
function showToast(type, title, message) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-xmark";
    if (type === "warning") iconClass = "fa-triangle-exclamation";
    if (type === "info") iconClass = "fa-circle-info";

    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// API Request Wrapper with Error Handling
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Server Error occurred");
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        showToast("error", "Error", error.message || "Failed to communicate with server");
        throw error;
    }
}

// ==========================================================================
// MODAL SYSTEM & CONFIRMATION DIALOGS
// ==========================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

function confirmDelete(title, message, onConfirm) {
    state.deleteCallback = onConfirm;
    const modalTitle = document.getElementById("confirmModalTitle");
    const modalMsg = document.getElementById("confirmModalMessage");

    if (modalTitle) modalTitle.textContent = title;
    if (modalMsg) modalMsg.textContent = message;

    openModal("confirmModal");
}

function initConfirmModal() {
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (typeof state.deleteCallback === "function") {
                await state.deleteCallback();
            }
            closeModal("confirmModal");
            state.deleteCallback = null;
        };
    }
}

// Navigation Initialization
function initNavigation() {
    const toggleBtn = document.getElementById("mobileToggle");
    const navMenu = document.getElementById("navMenu");

    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
    }

    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll(".nav-menu .nav-item");
    links.forEach(item => {
        const link = item.querySelector("a");
        if (link) {
            const href = link.getAttribute("href");
            if (href === currentPath || (currentPath === "" && href === "index.html")) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        }
    });

    initConfirmModal();
}

// ==========================================================================
// 1. DASHBOARD PAGE LOGIC
// ==========================================================================

async function initDashboardPage() {
    try {
        const stats = await fetchAPI("/dashboard/stats");
        state.dashboard = stats;

        // Update Stat Cards
        document.getElementById("totalProducts").textContent = stats.totalProducts;
        document.getElementById("totalCustomers").textContent = stats.totalCustomers;
        document.getElementById("totalSales").textContent = stats.totalSales;
        document.getElementById("totalRevenue").textContent = formatCurrency(stats.totalRevenue);
        document.getElementById("totalStock").textContent = stats.totalStock;
        document.getElementById("lowStockCount").textContent = stats.lowStockCount;

        // Render Recent Sales Table
        renderRecentSales(stats.recentSales);

        // Render Low Stock Widget
        renderLowStockWidget(stats.lowStockProducts);

        // Render Charts
        renderDashboardCharts(stats);

    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

function renderRecentSales(sales) {
    const container = document.getElementById("recentSalesBody");
    if (!container) return;

    if (!sales || sales.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fa-solid fa-receipt empty-icon"></i>
                    <div class="empty-title">No Sales Recorded Yet</div>
                    <div class="empty-desc">Create your first sale to start tracking revenue.</div>
                    <a href="sales.html" class="btn btn-primary btn-sm">+ New Sale</a>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = sales.map(sale => `
        <tr>
            <td><strong style="color: var(--accent-gold);">${sale.sale_id}</strong></td>
            <td>
                <div style="font-weight: 600;">${sale.customer_name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${sale.customer_id}</div>
            </td>
            <td>
                <div>${sale.product_name}</div>
                <div style="font-size: 11px; color: var(--accent-gold);">${sale.product_category || 'Garment'}</div>
            </td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05);">${sale.quantity} units</span></td>
            <td><strong style="font-size: 15px;">${formatCurrency(sale.total_amount)}</strong></td>
            <td><span class="badge badge-payment">${sale.payment_method || 'UPI'}</span></td>
            <td style="color: var(--text-secondary); font-size: 13px;">${formatDate(sale.sale_date)}</td>
        </tr>
    `).join("");
}

function renderLowStockWidget(products) {
    const container = document.getElementById("lowStockWidget");
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--success);">
                <i class="fa-solid fa-circle-check" style="font-size: 28px; margin-bottom: 8px;"></i>
                <div style="font-weight: 600;">Inventory Healthy</div>
                <div style="font-size: 12px; color: var(--text-muted);">All products have sufficient stock levels.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(9,11,14,0.4); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid var(--warning);">
            <div>
                <div style="font-weight: 600; font-size: 14px;">${p.name}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${p.category} | ${p.size}</div>
            </div>
            <div style="text-align: right;">
                <span class="badge badge-low-stock">${p.stock} left</span>
                <a href="products.html" style="font-size: 11px; display: block; margin-top: 4px; color: var(--accent-gold); text-decoration: none;">Restock →</a>
            </div>
        </div>
    `).join("");
}

function renderDashboardCharts(stats) {
    if (typeof Chart === "undefined") return;

    // 1. Revenue & Sales Chart
    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx) {
        if (state.revenueChart) state.revenueChart.destroy();

        // Build dataset from category or recent sales
        const labels = stats.categoryBreakdown.map(c => c._id);
        const stockData = stats.categoryBreakdown.map(c => c.totalStock);
        const countData = stats.categoryBreakdown.map(c => c.count);

        state.revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Shirts', 'Kurtis', 'Pants', 'Sarees'],
                datasets: [
                    {
                        label: 'Stock Quantity',
                        data: stockData.length ? stockData : [25, 15, 10, 8],
                        backgroundColor: 'rgba(212, 175, 55, 0.7)',
                        borderColor: '#d4af37',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Product Varieties',
                        data: countData.length ? countData : [3, 2, 2, 1],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    // 2. Category Doughnut Chart
    const categoryCtx = document.getElementById("categoryChart");
    if (categoryCtx) {
        if (state.categoryChart) state.categoryChart.destroy();

        const labels = stats.categoryBreakdown.map(c => c._id);
        const counts = stats.categoryBreakdown.map(c => c.count);

        state.categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Shirt', 'Kurti', 'Pant'],
                datasets: [{
                    data: counts.length ? counts : [10, 5, 3],
                    backgroundColor: ['#d4af37', '#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: '#161b24'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15 } }
                }
            }
        });
    }
}

// ==========================================================================
// 2. PRODUCTS PAGE LOGIC
// ==========================================================================

let productViewMode = 'grid';

async function initProductsPage() {
    try {
        state.products = await fetchAPI("/products");
        populateCategoryFilterOptions();
        renderProducts();
        updateProductStats();

        // Listeners for Search & Filter
        const searchInput = document.getElementById("productSearch");
        const categoryFilter = document.getElementById("productCategoryFilter");
        const sizeFilter = document.getElementById("productSizeFilter");
        const sortBySelect = document.getElementById("productSortBy");

        if (searchInput) searchInput.addEventListener("input", filterAndRenderProducts);
        if (categoryFilter) categoryFilter.addEventListener("change", filterAndRenderProducts);
        if (sizeFilter) sizeFilter.addEventListener("change", filterAndRenderProducts);
        if (sortBySelect) sortBySelect.addEventListener("change", filterAndRenderProducts);

        // Product Form Submit
        const productForm = document.getElementById("productForm");
        if (productForm) {
            productForm.addEventListener("submit", handleProductFormSubmit);
        }

    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function updateProductStats() {
    const totalProdEl = document.getElementById("totalProductCount");
    const totalStockEl = document.getElementById("totalInventoryStock");
    const totalValEl = document.getElementById("totalInventoryValuation");

    if (totalProdEl) totalProdEl.textContent = state.products.length;
    if (totalStockEl) {
        const sumStock = state.products.reduce((acc, p) => acc + Number(p.stock), 0);
        totalStockEl.textContent = sumStock;
    }
    if (totalValEl) {
        const sumVal = state.products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0);
        totalValEl.textContent = formatCurrency(sumVal);
    }
}

function populateCategoryFilterOptions() {
    const select = document.getElementById("productCategoryFilter");
    if (!select) return;

    const categories = [...new Set(state.products.map(p => p.category).filter(Boolean))];
    select.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join("");
}

function filterAndRenderProducts() {
    const searchText = (document.getElementById("productSearch")?.value || "").toLowerCase();
    const category = document.getElementById("productCategoryFilter")?.value || "all";
    const size = document.getElementById("productSizeFilter")?.value || "all";
    const sortBy = document.getElementById("productSortBy")?.value || "default";

    let filtered = state.products.filter(p => {
        const matchesSearch = (p.name || "").toLowerCase().includes(searchText) ||
                              (p.product_id || "").toLowerCase().includes(searchText) ||
                              (p.color || "").toLowerCase().includes(searchText);

        const matchesCat = category === "all" || (p.category || "").toLowerCase() === category.toLowerCase();
        const matchesSize = size === "all" || (p.size || "").toLowerCase() === size.toLowerCase();

        return matchesSearch && matchesCat && matchesSize;
    });

    // Sorting
    if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
    if (sortBy === "stock-low") filtered.sort((a, b) => a.stock - b.stock);
    if (sortBy === "stock-high") filtered.sort((a, b) => b.stock - a.stock);

    renderProductsList(filtered);
}

function setProductView(mode) {
    productViewMode = mode;
    document.getElementById("btnGridView")?.classList.toggle("active", mode === 'grid');
    document.getElementById("btnTableView")?.classList.toggle("active", mode === 'table');
    filterAndRenderProducts();
}

function renderProducts() {
    filterAndRenderProducts();
}

function renderProductsList(products) {
    const containerGrid = document.getElementById("productsGridContainer");
    const containerTable = document.getElementById("productsTableContainer");

    if (!containerGrid && !containerTable) return;

    if (products.length === 0) {
        const emptyHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
                <i class="fa-solid fa-shirt empty-icon"></i>
                <div class="empty-title">No Products Found</div>
                <div class="empty-desc">No garment items match your search filters or catalog is empty.</div>
                <button class="btn btn-primary" onclick="openAddProductModal()">+ Add New Product</button>
            </div>
        `;
        if (containerGrid) containerGrid.innerHTML = emptyHTML;
        if (containerTable) containerTable.innerHTML = emptyHTML;
        return;
    }

    if (productViewMode === 'grid') {
        if (containerTable) containerTable.style.display = "none";
        if (containerGrid) {
            containerGrid.style.display = "grid";
            containerGrid.innerHTML = products.map(p => {
                let badgeClass = "badge-in-stock";
                let badgeText = "IN STOCK";
                if (p.stock <= 0) { badgeClass = "badge-out-stock"; badgeText = "OUT OF STOCK"; }
                else if (p.stock <= 5) { badgeClass = "badge-low-stock"; badgeText = "LOW STOCK"; }

                return `
                    <div class="product-item-card">
                        <div class="product-top">
                            <div class="product-icon-box"><i class="fa-solid fa-shirt"></i></div>
                            <span class="product-id-tag">${p.product_id}</span>
                        </div>
                        <div>
                            <h3 class="product-title">${p.name}</h3>
                            <div class="product-cat">${p.category}</div>
                        </div>

                        <div class="product-specs">
                            <div><span class="spec-label">Size:</span> <span class="spec-val">${p.size}</span></div>
                            <div><span class="spec-label">Color:</span> <span class="spec-val">${p.color}</span></div>
                            <div style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                                <span class="spec-label">Stock Status:</span>
                                <span class="badge ${badgeClass}">${badgeText} (${p.stock})</span>
                            </div>
                        </div>

                        <div class="product-footer">
                            <div class="product-price-tag">${formatCurrency(p.price)}</div>
                            <div class="card-actions">
                                <button class="btn btn-secondary btn-icon" onclick="openEditProductModal('${p._id}')" title="Edit Product"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button class="btn btn-danger btn-icon" onclick="deleteProductHandler('${p._id}', '${p.name}')" title="Delete Product"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }
    } else {
        if (containerGrid) containerGrid.style.display = "none";
        if (containerTable) {
            containerTable.style.display = "block";
            containerTable.innerHTML = `
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Size</th>
                                <th>Color</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(p => {
                                let badgeClass = "badge-in-stock";
                                let badgeText = "In Stock";
                                if (p.stock <= 0) { badgeClass = "badge-out-stock"; badgeText = "Out of Stock"; }
                                else if (p.stock <= 5) { badgeClass = "badge-low-stock"; badgeText = "Low Stock"; }

                                return `
                                    <tr>
                                        <td><strong style="color: var(--accent-gold);">${p.product_id}</strong></td>
                                        <td><strong>${p.name}</strong></td>
                                        <td>${p.category}</td>
                                        <td>${p.size}</td>
                                        <td>${p.color}</td>
                                        <td><strong>${formatCurrency(p.price)}</strong></td>
                                        <td>${p.stock} units</td>
                                        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                                        <td>
                                            <button class="btn btn-secondary btn-icon" onclick="openEditProductModal('${p._id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                                            <button class="btn btn-danger btn-icon" onclick="deleteProductHandler('${p._id}', '${p.name}')"><i class="fa-solid fa-trash-can"></i></button>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }
}

function openAddProductModal() {
    state.editingProductId = null;
    document.getElementById("productModalTitle").textContent = "Add New Product";
    document.getElementById("productForm").reset();
    document.getElementById("p_product_id").readOnly = false;
    openModal("productModal");
}

function openEditProductModal(id) {
    const product = state.products.find(p => p._id === id || p.product_id === id);
    if (!product) return;

    state.editingProductId = product._id;
    document.getElementById("productModalTitle").textContent = "Edit Product";

    document.getElementById("p_product_id").value = product.product_id;
    document.getElementById("p_product_id").readOnly = true;
    document.getElementById("p_name").value = product.name;
    document.getElementById("p_category").value = product.category;
    document.getElementById("p_size").value = product.size;
    document.getElementById("p_color").value = product.color;
    document.getElementById("p_price").value = product.price;
    document.getElementById("p_stock").value = product.stock;

    openModal("productModal");
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    const payload = {
        product_id: document.getElementById("p_product_id").value.trim(),
        name: document.getElementById("p_name").value.trim(),
        category: document.getElementById("p_category").value.trim(),
        size: document.getElementById("p_size").value.trim(),
        color: document.getElementById("p_color").value.trim(),
        price: Number(document.getElementById("p_price").value),
        stock: Number(document.getElementById("p_stock").value)
    };

    try {
        if (state.editingProductId) {
            await fetchAPI(`/products/${state.editingProductId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            showToast("success", "Product Updated", `Successfully updated '${payload.name}'`);
        } else {
            await fetchAPI("/products", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            showToast("success", "Product Added", `Successfully added '${payload.name}'`);
        }

        closeModal("productModal");
        await initProductsPage();
    } catch (error) {
        // Error handled in fetchAPI
    }
}

function deleteProductHandler(id, name) {
    confirmDelete(
        "Delete Product",
        `Are you sure you want to delete product '${name}'? This action cannot be undone.`,
        async () => {
            try {
                await fetchAPI(`/products/${id}`, { method: "DELETE" });
                showToast("success", "Product Deleted", `Product '${name}' has been deleted.`);
                await initProductsPage();
            } catch (error) {
                // Error handled in fetchAPI
            }
        }
    );
}

// ==========================================================================
// 3. CUSTOMERS PAGE LOGIC
// ==========================================================================

async function initCustomersPage() {
    try {
        state.customers = await fetchAPI("/customers");
        renderCustomersTable(state.customers);
        updateCustomerStats();

        const searchInput = document.getElementById("customerSearch");
        if (searchInput) {
            searchInput.addEventListener("input", filterCustomers);
        }

        const customerForm = document.getElementById("customerForm");
        if (customerForm) {
            customerForm.addEventListener("submit", handleCustomerFormSubmit);
        }
    } catch (error) {
        console.error("Error loading customers:", error);
    }
}

function updateCustomerStats() {
    const totalCustEl = document.getElementById("totalCustomerCount");
    if (totalCustEl) totalCustEl.textContent = state.customers.length;
}

function filterCustomers() {
    const query = (document.getElementById("customerSearch")?.value || "").toLowerCase();
    const filtered = state.customers.filter(c =>
        (c.name || "").toLowerCase().includes(query) ||
        (c.customer_id || "").toLowerCase().includes(query) ||
        (c.phone || "").toLowerCase().includes(query) ||
        (c.email || "").toLowerCase().includes(query)
    );
    renderCustomersTable(filtered);
}

function renderCustomersTable(customers) {
    const container = document.getElementById("customersTableBody");
    if (!container) return;

    if (customers.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fa-solid fa-users-slash empty-icon"></i>
                    <div class="empty-title">No Customers Found</div>
                    <div class="empty-desc">No customer profiles match your search criteria.</div>
                    <button class="btn btn-primary" onclick="openAddCustomerModal()">+ Add Customer</button>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = customers.map(c => `
        <tr>
            <td><strong style="color: var(--accent-gold);">${c.customer_id}</strong></td>
            <td>
                <div style="font-weight: 700;">${c.name}</div>
            </td>
            <td><i class="fa-solid fa-phone" style="color: var(--accent-gold); margin-right: 6px;"></i> ${c.phone}</td>
            <td>${c.email ? `<i class="fa-solid fa-envelope" style="color: var(--text-muted); margin-right: 6px;"></i> ${c.email}` : '<span style="color: var(--text-muted);">-</span>'}</td>
            <td>${c.address || '<span style="color: var(--text-muted);">-</span>'}</td>
            <td>
                <button class="btn btn-secondary btn-icon" onclick="openEditCustomerModal('${c._id}')" title="Edit Customer"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn btn-danger btn-icon" onclick="deleteCustomerHandler('${c._id}', '${c.name}')" title="Delete Customer"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join("");
}

function openAddCustomerModal() {
    state.editingCustomerId = null;
    document.getElementById("customerModalTitle").textContent = "Add New Customer";
    document.getElementById("customerForm").reset();
    document.getElementById("c_customer_id").readOnly = false;
    openModal("customerModal");
}

function openEditCustomerModal(id) {
    const cust = state.customers.find(c => c._id === id || c.customer_id === id);
    if (!cust) return;

    state.editingCustomerId = cust._id;
    document.getElementById("customerModalTitle").textContent = "Edit Customer Profile";

    document.getElementById("c_customer_id").value = cust.customer_id;
    document.getElementById("c_customer_id").readOnly = true;
    document.getElementById("c_name").value = cust.name;
    document.getElementById("c_phone").value = cust.phone;
    document.getElementById("c_email").value = cust.email || "";
    document.getElementById("c_address").value = cust.address || "";

    openModal("customerModal");
}

async function handleCustomerFormSubmit(e) {
    e.preventDefault();

    const payload = {
        customer_id: document.getElementById("c_customer_id").value.trim(),
        name: document.getElementById("c_name").value.trim(),
        phone: document.getElementById("c_phone").value.trim(),
        email: document.getElementById("c_email").value.trim(),
        address: document.getElementById("c_address").value.trim()
    };

    try {
        if (state.editingCustomerId) {
            await fetchAPI(`/customers/${state.editingCustomerId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            showToast("success", "Customer Updated", `Updated details for '${payload.name}'`);
        } else {
            await fetchAPI("/customers", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            showToast("success", "Customer Added", `Added '${payload.name}' to customer registry`);
        }

        closeModal("customerModal");
        await initCustomersPage();
    } catch (error) {
        // Error handled in fetchAPI
    }
}

function deleteCustomerHandler(id, name) {
    confirmDelete(
        "Delete Customer",
        `Are you sure you want to remove customer '${name}'?`,
        async () => {
            try {
                await fetchAPI(`/customers/${id}`, { method: "DELETE" });
                showToast("success", "Customer Deleted", `Removed customer '${name}'`);
                await initCustomersPage();
            } catch (error) {
                // Error handled in fetchAPI
            }
        }
    );
}

// ==========================================================================
// 4. SALES PAGE LOGIC (DYNAMIC CALCULATIONS & AUTOMATED STOCK REDUCTION)
// ==========================================================================

async function initSalesPage() {
    try {
        const [sales, products, customers] = await Promise.all([
            fetchAPI("/sales"),
            fetchAPI("/products"),
            fetchAPI("/customers")
        ]);

        state.sales = sales;
        state.products = products;
        state.customers = customers;

        renderSalesTable(state.sales);
        updateSalesStats();

        // Register Filter Listeners
        const searchInput = document.getElementById("saleSearch");
        const paymentFilter = document.getElementById("salePaymentFilter");

        if (searchInput) searchInput.addEventListener("input", filterSales);
        if (paymentFilter) paymentFilter.addEventListener("change", filterSales);

        // Register Add Sale Form listeners
        const saleForm = document.getElementById("saleForm");
        if (saleForm) {
            saleForm.addEventListener("submit", handleSaleFormSubmit);
        }

        // Register Product & Quantity listeners in Sale Form for Real-time Calculation
        const productSelect = document.getElementById("s_product_id");
        const quantityInput = document.getElementById("s_quantity");

        if (productSelect) {
            productSelect.addEventListener("change", calculateSaleTotal);
        }
        if (quantityInput) {
            quantityInput.addEventListener("input", calculateSaleTotal);
        }

    } catch (error) {
        console.error("Error loading sales data:", error);
    }
}

function updateSalesStats() {
    const totalSalesEl = document.getElementById("totalSalesCount");
    const totalRevEl = document.getElementById("totalSalesRevenue");

    if (totalSalesEl) totalSalesEl.textContent = state.sales.length;
    if (totalRevEl) {
        const sumRev = state.sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
        totalRevEl.textContent = formatCurrency(sumRev);
    }
}

function filterSales() {
    const query = (document.getElementById("saleSearch")?.value || "").toLowerCase();
    const payment = document.getElementById("salePaymentFilter")?.value || "all";

    const filtered = state.sales.filter(s => {
        const matchesQuery = (s.sale_id || "").toLowerCase().includes(query) ||
                             (s.customer_name || "").toLowerCase().includes(query) ||
                             (s.customer_id || "").toLowerCase().includes(query) ||
                             (s.product_name || "").toLowerCase().includes(query) ||
                             (s.product_id || "").toLowerCase().includes(query);

        const matchesPayment = payment === "all" || (s.payment_method || "").toUpperCase() === payment.toUpperCase();

        return matchesQuery && matchesPayment;
    });

    renderSalesTable(filtered);
}

function renderSalesTable(sales) {
    const container = document.getElementById("salesTableBody");
    if (!container) return;

    if (sales.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fa-solid fa-receipt empty-icon"></i>
                    <div class="empty-title">No Sales Records Found</div>
                    <div class="empty-desc">No transaction records match your criteria.</div>
                    <button class="btn btn-primary" onclick="openAddSaleModal()">+ Create Sale</button>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = sales.map(s => `
        <tr>
            <td><strong style="color: var(--accent-gold);">${s.sale_id}</strong></td>
            <td>
                <div style="font-weight: 700;">${s.customer_name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${s.customer_id}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${s.product_name}</div>
                <div style="font-size: 11px; color: var(--accent-gold);">${s.product_id}</div>
            </td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05);">${s.quantity} units</span></td>
            <td><strong style="font-size: 16px; color: var(--text-primary);">${formatCurrency(s.total_amount)}</strong></td>
            <td><span class="badge badge-payment">${s.payment_method || 'UPI'}</span></td>
            <td style="color: var(--text-secondary); font-size: 13px;">${formatDate(s.sale_date)}</td>
            <td>
                <button class="btn btn-danger btn-icon" onclick="deleteSaleHandler('${s._id}', '${s.sale_id}')" title="Delete Sale & Refund Stock"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join("");
}

function openAddSaleModal() {
    state.editingSaleId = null;
    document.getElementById("saleModalTitle").textContent = "Record New Sale";
    document.getElementById("saleForm").reset();
    document.getElementById("s_sale_id").readOnly = false;

    // Set default sale_date to today
    document.getElementById("s_sale_date").value = new Date().toISOString().split("T")[0];

    // Auto-generate next Sale ID (e.g. S003)
    const nextIdNum = state.sales.length + 1;
    document.getElementById("s_sale_id").value = `S${String(nextIdNum).padStart(3, '0')}`;

    // Populate Customers dropdown
    const custSelect = document.getElementById("s_customer_id");
    if (custSelect) {
        if (state.customers.length === 0) {
            custSelect.innerHTML = '<option value="">No customers available - Add a customer first!</option>';
        } else {
            custSelect.innerHTML = '<option value="">-- Select Customer --</option>' +
                state.customers.map(c => `<option value="${c.customer_id}">[${c.customer_id}] ${c.name} (${c.phone})</option>`).join("");
        }
    }

    // Populate Products dropdown
    const prodSelect = document.getElementById("s_product_id");
    if (prodSelect) {
        if (state.products.length === 0) {
            prodSelect.innerHTML = '<option value="">No products available - Add a product first!</option>';
        } else {
            prodSelect.innerHTML = '<option value="">-- Select Product --</option>' +
                state.products.map(p => `<option value="${p.product_id}">[${p.product_id}] ${p.name} - ${formatCurrency(p.price)} (Stock: ${p.stock})</option>`).join("");
        }
    }

    calculateSaleTotal();
    openModal("saleModal");
}

function calculateSaleTotal() {
    const productId = document.getElementById("s_product_id")?.value;
    const quantity = Number(document.getElementById("s_quantity")?.value || 0);

    const priceEl = document.getElementById("calcUnitPrice");
    const stockEl = document.getElementById("calcStockAvail");
    const totalEl = document.getElementById("calcTotalAmount");
    const warningEl = document.getElementById("stockWarningMsg");

    if (!productId) {
        if (priceEl) priceEl.textContent = "₹0";
        if (stockEl) stockEl.textContent = "0";
        if (totalEl) totalEl.textContent = "₹0";
        if (warningEl) warningEl.style.display = "none";
        return;
    }

    const product = state.products.find(p => p.product_id === productId);
    if (!product) return;

    const unitPrice = Number(product.price);
    const availableStock = Number(product.stock);
    const totalAmount = unitPrice * Math.max(0, quantity);

    if (priceEl) priceEl.textContent = formatCurrency(unitPrice);
    if (stockEl) stockEl.textContent = availableStock;
    if (totalEl) totalEl.textContent = formatCurrency(totalAmount);

    if (warningEl) {
        if (quantity > availableStock) {
            warningEl.textContent = `⚠️ Warning: Requested quantity (${quantity}) exceeds available stock (${availableStock})!`;
            warningEl.style.display = "block";
            warningEl.style.color = "var(--danger)";
        } else {
            warningEl.style.display = "none";
        }
    }
}

async function handleSaleFormSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById("s_product_id").value;
    const quantity = Number(document.getElementById("s_quantity").value);

    const product = state.products.find(p => p.product_id === productId);
    if (product && quantity > product.stock) {
        showToast("error", "Insufficient Stock", `Cannot complete sale. Requested ${quantity}, but only ${product.stock} available in stock.`);
        return;
    }

    const payload = {
        sale_id: document.getElementById("s_sale_id").value.trim(),
        customer_id: document.getElementById("s_customer_id").value.trim(),
        product_id: productId.trim(),
        quantity: quantity,
        payment_method: document.getElementById("s_payment_method").value,
        sale_date: document.getElementById("s_sale_date").value
    };

    try {
        await fetchAPI("/sales", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showToast("success", "Sale Recorded 🎉", `Recorded sale '${payload.sale_id}' and automatically updated product stock!`);
        closeModal("saleModal");
        await initSalesPage();
    } catch (error) {
        // Error handled in fetchAPI
    }
}

function deleteSaleHandler(id, saleId) {
    confirmDelete(
        "Cancel / Refund Sale",
        `Are you sure you want to delete sale '${saleId}'? Product stock will be automatically restored.`,
        async () => {
            try {
                await fetchAPI(`/sales/${id}`, { method: "DELETE" });
                showToast("success", "Sale Deleted", `Sale '${saleId}' deleted and inventory restored.`);
                await initSalesPage();
            } catch (error) {
                // Error handled in fetchAPI
            }
        }
    );
}
