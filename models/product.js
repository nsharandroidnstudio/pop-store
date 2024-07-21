// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true } // Path to the image file
});

module.exports = mongoose.model('Product', productSchema);
