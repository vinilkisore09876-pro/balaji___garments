const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// Helper to query by _id or sale_id
const findSale = async (idParam) => {
    if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
        let sale = await Sale.findById(idParam);
        if (sale) return sale;
    }
    return await Sale.findOne({ sale_id: idParam });
};

// GET all sales with resolved customer and product details
router.get("/", async (req, res) => {
    try {
        const sales = await Sale.find().sort({ sale_date: -1, createdAt: -1 });

        // Enrich sales data with customer and product names for seamless UI display
        const enrichedSales = await Promise.all(
            sales.map(async (sale) => {
                const saleObj = sale.toObject();
                const customer = await Customer.findOne({ customer_id: sale.customer_id });
                const product = await Product.findOne({ product_id: sale.product_id });

                saleObj.customer_name = customer ? customer.name : sale.customer_id;
                saleObj.product_name = product ? product.name : sale.product_id;
                saleObj.product_category = product ? product.category : "";
                saleObj.unit_price = product ? product.price : 0;
                return saleObj;
            })
        );

        res.json(enrichedSales);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sales", error: error.message });
    }
});

// GET single sale
router.get("/:id", async (req, res) => {
    try {
        const sale = await findSale(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: "Sale record not found" });
        }
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sale", error: error.message });
    }
});

// CREATE sale (with automated stock deduction and validations)
router.post("/", async (req, res) => {
    try {
        const { sale_id, customer_id, product_id, quantity, payment_method, sale_date } = req.body;

        if (!sale_id || !customer_id || !product_id || !quantity) {
            return res.status(400).json({ message: "Sale ID, Customer ID, Product ID, and Quantity are required" });
        }

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number greater than 0" });
        }

        // 1. Check duplicate sale_id
        const existingSale = await Sale.findOne({ sale_id: sale_id.trim() });
        if (existingSale) {
            return res.status(400).json({ message: `Sale ID '${sale_id}' already exists!` });
        }

        // 2. Check Customer existence
        const customer = await Customer.findOne({ customer_id: customer_id.trim() });
        if (!customer) {
            return res.status(404).json({ message: `Customer with ID '${customer_id}' not found!` });
        }

        // 3. Check Product existence
        const product = await Product.findOne({ product_id: product_id.trim() });
        if (!product) {
            return res.status(404).json({ message: `Product with ID '${product_id}' not found!` });
        }

        // 4. Check Stock Availability
        if (product.stock < qty) {
            return res.status(400).json({
                message: `Insufficient stock! Requested: ${qty}, Available in inventory: ${product.stock}`
            });
        }

        // 5. Calculate total amount
        const total_amount = product.price * qty;

        // 6. Deduct product stock
        product.stock -= qty;
        await product.save();

        // 7. Save Sale
        const sale = new Sale({
            sale_id: sale_id.trim(),
            customer_id: customer_id.trim(),
            product_id: product_id.trim(),
            quantity: qty,
            total_amount: total_amount,
            payment_method: payment_method || "UPI",
            sale_date: sale_date ? new Date(sale_date) : new Date()
        });

        const savedSale = await sale.save();

        const responseObj = savedSale.toObject();
        responseObj.customer_name = customer.name;
        responseObj.product_name = product.name;

        res.status(201).json(responseObj);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE sale
router.put("/:id", async (req, res) => {
    try {
        const sale = await findSale(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: "Sale record not found" });
        }

        const { quantity, payment_method, sale_date } = req.body;

        if (quantity !== undefined && Number(quantity) !== sale.quantity) {
            const newQty = Number(quantity);
            if (isNaN(newQty) || newQty <= 0) {
                return res.status(400).json({ message: "Quantity must be greater than 0" });
            }

            const product = await Product.findOne({ product_id: sale.product_id });
            if (!product) {
                return res.status(404).json({ message: "Associated product no longer exists" });
            }

            const diff = newQty - sale.quantity; // positive if increasing, negative if decreasing
            if (diff > 0 && product.stock < diff) {
                return res.status(400).json({
                    message: `Insufficient stock to increase quantity! Additional needed: ${diff}, Available: ${product.stock}`
                });
            }

            // Adjust stock
            product.stock -= diff;
            await product.save();

            sale.quantity = newQty;
            sale.total_amount = product.price * newQty;
        }

        if (payment_method) sale.payment_method = payment_method;
        if (sale_date) sale.sale_date = new Date(sale_date);

        const updatedSale = await sale.save();
        res.json(updatedSale);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE sale (refunds product stock)
router.delete("/:id", async (req, res) => {
    try {
        const sale = await findSale(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: "Sale record not found" });
        }

        // Refund product stock
        const product = await Product.findOne({ product_id: sale.product_id });
        if (product) {
            product.stock += sale.quantity;
            await product.save();
        }

        await Sale.deleteOne({ _id: sale._id });
        res.json({ message: "Sale deleted successfully and stock refunded", sale });
    } catch (error) {
        res.status(500).json({ message: "Error deleting sale", error: error.message });
    }
});

module.exports = router;
