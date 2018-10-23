const mongoose = require('mongoose');

// Mongoose Schema definition
const Schema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    location: String,
    latitude: Number,
    longitude: Number,
    rating: Number,
    user_photo_url: String,
    items: Array
});

module.exports = mongoose.model('User', Schema);
