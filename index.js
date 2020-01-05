const express = require('express');
const logger = require('morgan');
var app = express();
const path = require('path');
const Crawler = require('./route/CrawlRoute.js');
const Cookie = require('./route/CookieRoute.js');
const Scope = require('./route/ScopeRoute.js');

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));
app.use(Cookie);
app.use(Crawler);
app.use(Scope);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('出错了！');
});

console.log("Listen: http://127.0.0.1:3000");
app.listen(3000);