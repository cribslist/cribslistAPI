const mongoose = require('mongoose');

// Mongoose Schema definition
const Schema = new mongoose.Schema({
    id: Number,
    title: String,
    price: Number,
    description: String,
    seller: Number,
    location: String,
    latitude: Number,
    longitude: Number,
    created: String,
    category: Array,
    photo_urls: Array,
    thumbnail_url: String
});



Schema.index({title: 'text', description: 'text'})

const Item =  mongoose.model('Item', Schema)
Item.VALID_FIELDS = {
    id: Number,
    title: String,
    price: Number,
    description: String,
    seller: Number,
    location: String,
    latitude: Number,
    longitude: Number,
    created: String,
    category: Array,
    photo_urls: Array,
    thumbnail_url: String
};
module.exports = Item;
