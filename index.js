const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const config = require('./config');
const fs = require('fs');
const busboy = require('connect-busboy');

const account = require('./public/account.json');
const { ImageFile, Item, User } = require('./db');

const mongoose = require('mongoose');
const mongoURL = process.env.MONGOLAB_URI || config.MONGODB_URI;
mongoose.connect(mongoURL, function(error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});

express()
    .use('/', express.static(__dirname + '/public'))
    .use(busboy())
    .get('/item/:itemId', (req, res) => Item.find({ id: req.params.itemId }, (err, items) => res.json(items)))
    .get('/items', (req, res) => Item.find((err, items) => res.json(items)))
    .get('/my_items/:itemId', (req, res) => Item.find({ seller: req.params.itemId }, (err, items) => res.json(items)))
    .post('/items', (req, res) => {
        try {
            const item = new Item(req.body);
            item.id = Date.now();
        } catch (e) {
            res.status(400).send({ error: 'invalid data' });
        }
        item.save(err => res.json(200, item));
    })
    .post('/image_upload', (req, res) => {
        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', (fieldname, file, filename) => {
            const extension = filename.split('.')[1];
            if (!['png', 'jpg', 'gif', 'jpeg'].some(ext => ext === extension)) {
                return res.status(400).send({ error: 'invalid type' });
            }
            const imgPath = `/images/img-${Date.now()}.${extension}`;
            console.log('Uploading: ' + filename);
            fstream = fs.createWriteStream(__dirname + '/public/' + imgPath);
            file.pipe(fstream);
            fstream.on('close', () => {
                const imgFile = new ImageFile({
                    path: imgPath,
                    size: file.size
                });
                imgFile.save();
                res.json(imgFile);
            });
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
