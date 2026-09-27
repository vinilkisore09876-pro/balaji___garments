const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        product_id: {
            type: String,
            required: [true, "Product ID is required"],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true
        },
        size: {
            type: String,
            required: [true, "Size is required"],
            trim: true
        },
        color: {
            type: String,
            required: [true, "Color is required"],
            trim: true
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: [0, "Stock cannot be negative"]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);