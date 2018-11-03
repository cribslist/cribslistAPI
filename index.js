const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const config = require('./config');
const fs = require('fs');
const busboy = require('connect-busboy');
const jsonItems = require('./public/items.json');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const cloudinary = require('cloudinary');

const account = require('./public/account.json');
const { ImageFile, Item, User, Comment } = require('./db');

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

cloudinary.config({
    cloud_name: config.CN_NAME,
    api_key: config.CN_API_KEY,
    api_secret: config.CN_API_SECRET
});

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
        const public_id = Date.now();
        const imgPath = `/images/img-${public_id}.${extension}`;
        console.log(file.mimetype, file, ' this is the file and mimetype');
        if (!/image./i.test(file.mimetype)) {
            return res.status(400).send({ error: 'invalid type' });
        }
        console.log('Uploading: ' + file.originalname);
        const tempImgPath = './public/' + imgPath;
        fs.writeFile(tempImgPath, file.buffer, function(err) {
            if (err) throw err;
            cloudinary.v2.uploader.upload(tempImgPath, { public_id }, (error, result) => {
                const imgFile = new ImageFile({
                    path: result.url,
                    size: result.bytes,
                    public_id
                });
                imgFile.save();
                console.log('image saved from: ', tempImgPath);
                fs.unlink(tempImgPath, () => {
                    console.log('deleting image');
                    res.json(imgFile);
                });
            });
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
    .get('/comments/:id', (req, res) =>
        Comment.find({ thread_id: req.params.id }, (err, comment) => res.json(comment))
    )
    .get('/all_comments/', (req, res)=> Comment.find((err, comments)=> res.json(comments)))
    .delete('/comments/:comment_id', (req, res)=>{
        Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
            if(err){
                return res.status(400).send({ error: 'no convo found' });
            } else {
                res.json({ message: 'great success' });
            }
        })
    })
    .post('/comments/:id', (req, res) => {
        const { query } = req;
        const comment = Object.keys(query).reduce((acc, param) => {
            if (Comment.VALID_PARAMS.hasOwnProperty(param)) {
                acc[param] = query[param];
            } else {
                console.log('invalid param not being added ', param, query[param]);
            }
            return acc;
        }, {});
        if (!Object.keys(comment).length) {
            const errMsg = 'no valid params to add';
            console.log(errMsg);
            return res.status(400).send({ error: 'no convo found' });
        }
        const newComment = new Comment(comment);
        newComment.thread_id = req.params.id;
        newComment.save();
        console.log('saving comment', comment);
        res.json(newComment);
    })
    .delete('/comments/:id', (req, res) => {
        const { id } = req.params;
        Comment.findByIdAndRemove(id).exec(err => {
            if (err) {
                return res.status(400).send({ error: 'something went wrong' });
            }
            res.json({ message: 'great success' });
        });
    })
    .delete('/image/:id', (req, res) => {
        const { id } = req.params;
        ImageFile.find({ public_id: id }, (err, img) => {
            if (!img || err) {
                return res.status(400).send({ error: 'something went wrong' });
            }
            cloudinary.v2.uploader.destroy(id, (error, result) =>
                ImageFile.deleteOne({ public_id: id }, err => res.json({ msg: 'success' }))
            );
        });
    })
    .get('/image_files', (req, res) => ImageFile.find((err, imgs) => res.json(imgs)))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
