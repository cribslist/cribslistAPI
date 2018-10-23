const mongoose = require('mongoose');

// Mongoose Schema definition
const Schema = new mongoose.Schema({
    path: String,
    size: Number
});

module.exports = mongoose.model('Image', Schema);
