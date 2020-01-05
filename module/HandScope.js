const db = require('./Databases');
const assert = require('assert');


// 存根域
async function insertScope(domain){
    if(domain.indexOf("http://") !== -1){
        domain = domain.replace("http://", "");
    }
    if(domain.indexOf("https://") !== -1){
        domain = domain.replace("http://", "");
    }
    let condition  = {"domain": domain};
    const data = await db.find("scopes", condition);
    if(data.length !== 0){
        console.log("Scope already exist，ignore...");
    }else {
        db.insertOne("scopes", condition);
        console.log(`Scope ${domain} insert success`);
    }

}

async function findScope() {
    const data = await db.find("scopes", {});
    if(data.length > 0){
        let domains = [];
        for(let d of data){
            domains.push(d['domain']);
        }
        return domains;
    }else {
        console.log(`findScope() result is empty`);
        return null;
    }
}




exports.insertScope = insertScope;
exports.findScope = findScope;