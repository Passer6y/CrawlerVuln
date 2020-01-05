const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const router = express.Router();
const ScopeDB = require('../module/HandScope.js');


function readFileToArr(fileName) {
    var data = fs.readFileSync(fileName).toString("UTF-8");
    return data.split("\n");
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/upload/");    // 保存的路径，备注：需要自己创建
    },
    filename: function (req, file, cb) {
        // 保存文件 时间戳+原始文件名
        cb(null, Date.now() + '-scopes-' + file.originalname);
    }
});

var upload = multer({ storage: storage });


router.post('/add-scopes', upload.single('scopes'), function (req, res, next) {
    try{
        var file = req.file;
        res.send("Add target success, Please wait minutes");
        let scopes = readFileToArr(file.path);
        for(let domain of scopes){
            ScopeDB.insertScope(domain);
        }
    }catch (e) {
        res.send("Add Scope failed " + e.message);
    }
});

module.exports = router;

