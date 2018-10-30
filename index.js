const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const config = require('./config');
const fs = require('fs');
const busboy = require('connect-busboy');
const jsonItems = require('./public/items.json');
const bodyParser = require('body-parser');

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

express()
    .use('/', express.static(__dirname + '/public'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(busboy())
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
    .post('/image_upload', (req, res) => {
        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', (fieldname, file, filename) => {
            const extension = filename.split('.')[1];
            const imgPath = `/images/img-${Date.now()}.${extension}`;
            console.log('Uploading: ' + filename);
            fstream = fs.createWriteStream(__dirname + '/public/' + imgPath);
            file.pipe(fstream);
            fstream.on('close', () => {
                const imgFile = new ImageFile({
                    path: "http://cribslist.herokuapp.com/" + imgPath,
                    size: file.size
                });
                imgFile.save();
                res.json(imgFile);
            });
        });
    })
    .post('/items', (req, res) => {
        req.pipe(req.busboy);
        const itemData = {};
        let invalid = false;
        req.busboy.on('field', function(
            fieldname,
            val,
            fieldnameTruncated,
            valTruncated,
            encoding,
            mimetype
        ) {
            if (Item.VALID_FIELDS.hasOwnProperty(fieldname) && val) {
                itemData[fieldname] = val;
                return;
            }
            invalid = true;

        });
        req.busboy.on('finish', function() {
            if (Object.keys(itemData) && !invalid) {
                const item = new Item(itemData);
                item.id = Date.now();
                if(!itemData.thumbnail_url){
                    item.thumbnail_url = item.photo_urls[0] || "http://cribslist.herokuapp.com/images/img-1540871053357.jpg"
                }
                if(!itemData.seller){
                    item.seller = (Date.now() + "").slice(-4);
                }
                item.created = new Date().toISOString().split('.')[0];

                if(!itemData.category){
                    item.category = [];
                }

                item.save(err => res.json(item));
            } else {
                const error = invalid ? "bad data sent" : "no data sent";
                res.status(400).send({ error });
            }
        });
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
//new aloha baby party shirt
//This item is in like new condition. Bought it on a recent trip to hawaii. It is machine wash safe and was only used once. 35 obo
