const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        customer_id: {
            type: String,
            required: [true, "Customer ID is required"],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            default: ""
        },
        address: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
