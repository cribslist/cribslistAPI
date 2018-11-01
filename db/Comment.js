const mongoose = require('mongoose');

const PARAMS = {
    user_id: Number,
    username: String,
    picture_url: String,
    text: String,
    thread_id: Number
}
const Schema = new mongoose.Schema(PARAMS);
const Comment = mongoose.model('Comment', Schema);
Comment.VALID_PARAMS = PARAMS;
module.exports = Comment;
