var express = require('express');
const path = require('path');
const fs = require('fs');
var router = express.Router();
const cookie = require('../module/HandleCookies.js');



router.post('/add-cookie', function (req, res, next) {
    try{
        // 这里要存根域名，且根域前有.号
        let domain = req.body.domain;
        let name = req.body.name;
        let value = req.body.value;
        cookie.insertCookie(domain, name, value);
        res.send("Add Cookie success");
    }catch (e) {
        res.send("Add Cookie failed " + e.message);
    }
});


module.exports = router;