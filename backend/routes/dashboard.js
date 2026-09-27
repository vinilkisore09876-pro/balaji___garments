const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");

// GET DASHBOARD STATISTICS
router.get("/stats", async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalCustomers = await Customer.countDocuments();
        const totalSales = await Sale.countDocuments();

        const stockResult = await Product.aggregate([
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ]);
        const totalStock = stockResult.length > 0 ? stockResult[0].totalStock : 0;

        const revenueResult = await Sale.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$total_amount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });
        const outOfStockProducts = await Product.countDocuments({ stock: 0 });

        const lowStockItemsList = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).lean();

        const rawRecentSales = await Sale.find().sort({ sale_date: -1, createdAt: -1 }).limit(6).lean();

        const enrichedRecentSales = await Promise.all(
            rawRecentSales.map(async (sale) => {
                const cust = await Customer.findOne({ customer_id: sale.customer_id });
                const prod = await Product.findOne({ product_id: sale.product_id });
                return {
                    ...sale,
                    customer_name: cust ? cust.name : sale.customer_id,
                    product_name: prod ? prod.name : sale.product_id,
                    product_category: prod ? prod.category : ""
                };
            })
        );

        const categoryBreakdown = await Product.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 }, totalStock: { $sum: "$stock" } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            totalProducts,
            totalCustomers,
            totalSales,
            totalRevenue,
            totalStock,
            lowStockCount,
            lowStockProducts: lowStockItemsList,
            recentSales: enrichedRecentSales,
            categoryBreakdown,
            statistics: {
                totalProducts,
                totalCustomers,
                totalSales,
                totalRevenue,
                totalStock,
                lowStockProducts: lowStockCount,
                outOfStockProducts
            }
        });

    } catch (error) {
        console.error("Dashboard statistics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics",
            error: error.message
        });
    }
});

module.exports = router;