# Cribslist test API

Simple node app to serve up fixtures and images for testing.

## getting started

```
git clone git@github.com:Morgantheplant/cribslistAPI.git
cd cribslistAPI
npm i
npm run start
```
for local development run the following and visit localhost:5000/<path to fixture>

```
npm run dev
```

files in the public directory will be served up on Heroku. Drop files in there you wish to be served

[http://cribslist.herokuapp.com/images/1-a.png](http://cribslist.herokuapp.com/images/1-a.png)

[http://cribslist.herokuapp.com/item.json](http://cribslist.herokuapp.com/item.json)

to deploy changes run
```
git push heroku mater
```
