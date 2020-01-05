const assert = require('assert');
const db = require('./Databases.js');
const urllib = require('url');

// 实现两个功能：Chrome插件入库，Crawler爬虫读库

// domain(根域) name value
async function insertCookie(domain, name, value){
    let condition  = {"domain": domain, "name": name};
    let cookies = {"domain": domain, "name": name, "value": value};
    const data = await db.find("cookie", condition);
    if(data.length !== 0){
        console.log("Cookie already exist，Update...");
        db.updateOne("cookie", condition, {"value": value});
    }else {
        const result = await db.insertOne("cookie", cookies);
        assert.equal(1, result.insertedCount);
    }
}


async function findCookie(url) {
    // 模糊查找根域名、直接查找ip
    let hostname = urllib.parse(url).hostname;
    if(hostname){
        hostname = isNaN(hostname.substring(hostname.lastIndexOf('.'))) ? hostname.substring(hostname.substring(0, hostname.lastIndexOf('.')).lastIndexOf('.') + 1) : hostname;
        const data = await db.find("cookie", {"domain":{$regex:hostname, $options:'i'}});
        if(data.length > 0){
            console.log(data);
            return data;
        }else {
            console.log(`findCookie(${hostname}) result is empty`);
            return null
        }
    }else {
        console.log(`findCookie failed, host is empty: ${url}`);
    }
}

//const cookies = {"domain": "huawei.com", "name":"JSESSIONID", "value": "174DBED059BBFF2E8C5630538C9C4EA9E72C7661EC18E1C3D"}
// insertCookie(cookies['domain'], cookies['name'], cookies['value']);

//findCookie("https://id5.cloud.huawei.com/CAS/IDM_W/ajaxHandler/getAgreementContent?reflushCode=0.9561319125296217");


exports.insertCookie = insertCookie;
exports.findCookie = findCookie;


