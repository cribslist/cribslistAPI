const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

const item = require('./public/item.json');
const items = require('./public/items.json');
const account = require('./public/account.json');

express()
    .use('/', express.static(__dirname + '/public'))
    .get('/item', (req, res) => res.json(item))
    .get('/items', (req, res) => res.json(items))
    .get('/account', (req, res) => res.json(account))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
