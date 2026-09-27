const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load environment variables from ROOT .env
require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// Models
const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Sale = require("./models/Sale");

// Seed initial database records
async function seedInitialData() {
    try {
        const prodCount = await Product.countDocuments();

        if (prodCount === 0) {
            console.log("Seeding initial products into database...");

            await Product.insertMany([
                {
                    product_id: "P001",
                    name: "Men's Shirt",
                    category: "Shirt",
                    size: "L",
                    color: "Black",
                    price: 799,
                    stock: 25
                },
                {
                    product_id: "P002",
                    name: "Women Kurti",
                    category: "Kurti",
                    size: "M",
                    color: "Blue",
                    price: 999,
                    stock: 32
                }
            ]);
        }

        const custCount = await Customer.countDocuments();

        if (custCount === 0) {
            console.log("Seeding initial customers into database...");

            await Customer.insertMany([
                {
                    customer_id: "C001",
                    name: "Vinil",
                    phone: "9876543210",
                    email: "vinil@gmail.com",
                    address: "Chennai"
                }
            ]);
        }

        const saleCount = await Sale.countDocuments();

        if (saleCount === 0) {
            console.log("Seeding initial sales into database...");

            await Sale.insertMany([
                {
                    sale_id: "S001",
                    customer_id: "C001",
                    product_id: "P001",
                    quantity: 2,
                    total_amount: 1598,
                    payment_method: "UPI",
                    sale_date: new Date("2026-09-27")
                }
            ]);
        }
    } catch (err) {
        console.error("Error seeding initial data:", err.message);
    }
}

// Database Connection with Resilient Fallback
const MONGODB_URI = process.env.MONGODB_URI;
let isDbConnected = false;

const connectDB = async () => {

    // 1. Try MongoDB Atlas connection string from .env
    if (MONGODB_URI) {
        try {
            console.log("Connecting to MongoDB Atlas...");

            await mongoose.connect(MONGODB_URI, {
                dbName: "balaji_garments",
                serverSelectionTimeoutMS: 4000
            });

            isDbConnected = true;

            console.log("==========================================");
            console.log("✓ Connected successfully to MongoDB Atlas: balaji_garments");
            console.log("==========================================");

            await seedInitialData();

            return;

        } catch (err) {
            console.warn(
                "⚠️ MongoDB Atlas IP/Connection warning:",
                err.message
            );
        }
    }

    // 2. Try Local MongoDB fallback if Atlas is IP-restricted
    try {
        console.log(
            "Attempting local MongoDB connection fallback (mongodb://127.0.0.1:27017/balaji_garments)..."
        );

        await mongoose.connect(
            "mongodb://127.0.0.1:27017/balaji_garments",
            {
                serverSelectionTimeoutMS: 3000
            }
        );

        isDbConnected = true;

        console.log(
            "✓ Connected to local MongoDB instance: balaji_garments"
        );

        await seedInitialData();

        return;

    } catch (err) {
        console.warn(
            "⚠️ Local MongoDB unavailable:",
            err.message
        );
    }

    // 3. Fallback to in-memory MongoDB Server if external DBs unreachable
    try {
        console.log(
            "Initializing In-Memory MongoDB Engine fallback..."
        );

        const { MongoMemoryServer } = require("mongodb-memory-server");

        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        await mongoose.connect(uri, {
            dbName: "balaji_garments"
        });

        isDbConnected = true;

        console.log("==========================================");
        console.log("✓ In-Memory MongoDB Engine Active & Ready!");
        console.log("==========================================");

        await seedInitialData();

    } catch (err) {
        console.error(
            "✕ Database Initialization Warning:",
            err.message
        );
    }
};

connectDB();

// API Routes
const productRoutes = require("./routes/products");
const customerRoutes = require("./routes/customers");
const saleRoutes = require("./routes/sales");
const dashboardRoutes = require("./routes/dashboard");

app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        app: "Balaji Garments Management System",
        dbState:
            mongoose.connection.readyState === 1
                ? "Connected"
                : "Disconnected",
        timestamp: new Date()
    });
});

// Serve frontend HTML pages explicitly
app.get("/index.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend", "index.html")
    );
});

app.get("/products.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend", "products.html")
    );
});

app.get("/customers.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend", "customers.html")
    );
});

app.get("/sales.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend", "sales.html")
    );
});

// Fallback for non-API routes to serve index.html
app.use((req, res, next) => {

    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            message: "API endpoint not found"
        });
    }

    res.sendFile(
        path.join(__dirname, "../frontend", "index.html")
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);

    res.status(500).json({
        message: "Internal Server Error",
        error: err.message
    });
});

// Render / Production Port Configuration
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ Balaji Garments Server running on http://0.0.0.0:${PORT}`);
    console.log(`  ➔ Dashboard: http://0.0.0.0:${PORT}/index.html`);
    console.log(`  ➔ Products:  http://0.0.0.0:${PORT}/products.html`);
    console.log(`  ➔ Customers: http://0.0.0.0:${PORT}/customers.html`);
    console.log(`  ➔ Sales:     http://0.0.0.0:${PORT}/sales.html`);
});