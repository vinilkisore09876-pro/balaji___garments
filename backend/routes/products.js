const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Helper to query by _id or product_id
const findProduct = async (idParam) => {
    if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
        let prod = await Product.findById(idParam);
        if (prod) return prod;
    }
    return await Product.findOne({ product_id: idParam });
};

// GET all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error: error.message });
    }
});

// GET single product by ID or product_id
router.get("/:id", async (req, res) => {
    try {
        const product = await findProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
});

// ADD new product
router.post("/", async (req, res) => {
    try {
        const { product_id, name, category, size, color, price, stock } = req.body;

        if (!product_id || !name || !category || !size || !color || price === undefined || stock === undefined) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check for duplicate product_id
        const existing = await Product.findOne({ product_id: product_id.trim() });
        if (existing) {
            return res.status(400).json({ message: `Product ID '${product_id}' already exists!` });
        }

        const product = new Product({
            product_id: product_id.trim(),
            name: name.trim(),
            category: category.trim(),
            size: size.trim(),
            color: color.trim(),
            price: Number(price),
            stock: Number(stock)
        });

        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE product by ID or product_id
router.put("/:id", async (req, res) => {
    try {
        const product = await findProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const { product_id, name, category, size, color, price, stock } = req.body;

        if (product_id && product_id !== product.product_id) {
            const existing = await Product.findOne({ product_id: product_id.trim() });
            if (existing) {
                return res.status(400).json({ message: `Product ID '${product_id}' already exists!` });
            }
            product.product_id = product_id.trim();
        }

        if (name !== undefined) product.name = name.trim();
        if (category !== undefined) product.category = category.trim();
        if (size !== undefined) product.size = size.trim();
        if (color !== undefined) product.color = color.trim();
        if (price !== undefined) product.price = Number(price);
        if (stock !== undefined) product.stock = Number(stock);

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE product by ID or product_id
router.delete("/:id", async (req, res) => {
    try {
        const product = await findProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.deleteOne({ _id: product._id });
        res.json({ message: "Product deleted successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
});

module.exports = router;