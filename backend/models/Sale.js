const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
    {
        sale_id: {
            type: String,
            required: [true, "Sale ID is required"],
            unique: true,
            trim: true
        },
        customer_id: {
            type: String,
            required: [true, "Customer ID is required"],
            trim: true
        },
        product_id: {
            type: String,
            required: [true, "Product ID is required"],
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },
        total_amount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"]
        },
        payment_method: {
            type: String,
            enum: ["UPI", "Cash", "Card", "Net Banking"],
            default: "UPI"
        },
        sale_date: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
