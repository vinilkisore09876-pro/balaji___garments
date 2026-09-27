const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// Helper to query by _id or customer_id
const findCustomer = async (idParam) => {
    if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
        let cust = await Customer.findById(idParam);
        if (cust) return cust;
    }
    return await Customer.findOne({ customer_id: idParam });
};

// GET all customers
router.get("/", async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch customers", error: error.message });
    }
});

// GET single customer
router.get("/:id", async (req, res) => {
    try {
        const customer = await findCustomer(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: "Error fetching customer", error: error.message });
    }
});

// ADD customer
router.post("/", async (req, res) => {
    try {
        const { customer_id, name, phone, email, address } = req.body;

        if (!customer_id || !name || !phone) {
            return res.status(400).json({ message: "Customer ID, Name, and Phone are required" });
        }

        const existing = await Customer.findOne({ customer_id: customer_id.trim() });
        if (existing) {
            return res.status(400).json({ message: `Customer ID '${customer_id}' already exists!` });
        }

        const customer = new Customer({
            customer_id: customer_id.trim(),
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.trim() : "",
            address: address ? address.trim() : ""
        });

        const savedCustomer = await customer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE customer
router.put("/:id", async (req, res) => {
    try {
        const customer = await findCustomer(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const { customer_id, name, phone, email, address } = req.body;

        if (customer_id && customer_id !== customer.customer_id) {
            const existing = await Customer.findOne({ customer_id: customer_id.trim() });
            if (existing) {
                return res.status(400).json({ message: `Customer ID '${customer_id}' already exists!` });
            }
            customer.customer_id = customer_id.trim();
        }

        if (name !== undefined) customer.name = name.trim();
        if (phone !== undefined) customer.phone = phone.trim();
        if (email !== undefined) customer.email = email.trim();
        if (address !== undefined) customer.address = address.trim();

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
    try {
        const customer = await findCustomer(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        await Customer.deleteOne({ _id: customer._id });
        res.json({ message: "Customer deleted successfully", customer });
    } catch (error) {
        res.status(500).json({ message: "Error deleting customer", error: error.message });
    }
});

module.exports = router;
