const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const config = require('./config');
const fs = require('fs');
const busboy = require('connect-busboy');
const jsonItems = require('./public/items.json');
const bodyParser = require('body-parser');
var multer = require('multer');
// var storage = multer.diskStorage({
//    destination: function (req, file, cb) {
//     cb(null, './public/images/')
//    },
//    filename: function (req, file, cb) {
//      cb(null, Date.now() + path.extname(file.originalname))
//   } });
var upload = multer();

const account = require('./public/account.json');
const { ImageFile, Item, User } = require('./db');

const mongoose = require('mongoose');
const mongoURL = process.env.MONGOLAB_URI || config.MONGODB_URI;
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoURL, { useNewUrlParser: true });

const paginationParams = ({ count, page }) => {
    const ITEM_COUNT_LIMIT = 90;
    const limit = Math.min(Math.max(count, 1), ITEM_COUNT_LIMIT);
    return {
        limit,
        skip: Math.max(0, page) * limit
    };
};

const sortByParams = req => {
    // todo; add logic here
    return {};
};

const isParseableField = name => {
    const fields = { photo_urls: true, category: true };
    return fields[name];
};

express()
    .use('/', express.static(__dirname + '/public'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .get('/item/:itemId', (req, res) => Item.find({ id: req.params.itemId }, (err, items) => res.json(items)))
    .get('/items', (req, res) => {
        const { skip, limit } = paginationParams(req.query);
        const { query } = req.query;
        if (!query || !query.trim()) {
            Item.find().limit(limit).skip(skip).exec((err, items) => res.json(items));
            return;
        }

        Item.find({ $text: { $search: query } })
            .limit(limit)
            .skip(skip)
            .exec((err, items) => res.json(items));
        return;
    })
    .get('/my_items/:itemId', (req, res) => {
        const { skip, limit } = paginationParams(req.query);
        Item.find({ seller: req.params.itemId })
            .skip(skip)
            .limit(limit)
            .exec((err, items) => res.json(items));
    })
    .post('/image_upload', upload.single('file'), (req, res) => {
        const { file } = req;
        const extension = file.originalname.split('.')[1];
        const imgPath = `/images/img-${Date.now()}.${extension}`;
        console.log(file.mimetype, file, ' this is the file and mimetype')
        if (!/image./i.test(file.mimetype)) {
            return res.status(400).send({ error: 'invalid type' });
        }
        console.log('Uploading: ' + file.originalname);
        fs.writeFile('./public/' + imgPath, file.buffer, function(err) {
            if (err) throw err;
            const imgFile = new ImageFile({
                path: 'http://cribslist.herokuapp.com' + imgPath,
                size: file.size
            });
            imgFile.save();
            res.json(imgFile);
        });
    })
    .post('/items', upload.none(), (req, res) => {
        const { body } = req;
        if (!body) {
            res.status(400).send({ error: 'no data sent' });
        }
        const itemData = Object.keys(body).reduce((acc, fieldname) => {
            const val = body[fieldname];
            if (Item.VALID_FIELDS.hasOwnProperty(fieldname) && val) {
                try {
                    acc[fieldname] = isParseableField(fieldname) ? JSON.parse(val) : val;
                } catch (e) {
                    console.error('value did not parse: ' + fieldname, val);
                }
            }
            return acc;
        }, {});

        if (!Object.keys(itemData).length) {
            res.status(400).send({ error: 'no parseable values' });
            return;
        }

        const item = new Item(itemData);
        item.id = Date.now();
        if (!itemData.thumbnail_url) {
            item.thumbnail_url =
                item.photo_urls[0] || 'http://cribslist.herokuapp.com/images/img-1540871053357.jpg';
        }
        if (!itemData.seller) {
            item.seller = (Date.now() + '').slice(-4);
        }
        item.created = new Date().toISOString().split('.')[0];

        if (!itemData.category) {
            item.category = [];
        }
        console.log(item);
        item.save(err => res.json(item));
    })
    .get('/image/:id', (req, res) => ImageFile.findById(req.params.id, (err, img) => res.json(img)))
    .get('/account', (req, res) => res.json(account))
    .get('/accounts', (req, res) => User.find((err, users) => res.json(users)))
    .get('/account/:id', (req, res) => User.find({ id: req.params.id }, (err, account) => res.json(account)))
    .delete('/image/:id', (req, res) =>
        ImageFile.findById(req.params.id, (err, img) => {
            fs.unlink(img.path, () => {
                ImageFile.deleteOne({ _id: req.params.id }, err => res.json({ msg: 'success' }));
            });
        })
    )
    .get('/image_files', (req, res) => ImageFile.find((err, imgs) => res.json(imgs)))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
