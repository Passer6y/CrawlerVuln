var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://ip:port/";



async function find(collectionname,json) {
    const client = new MongoClient(url, {useUnifiedTopology: true});
    await client.connect();
    const col = client.db("spider").collection(collectionname);
    const result = await col.find(json).toArray();
    client.close();
    return result;
}

async function insertOne(collectionname, json){
    const client = new MongoClient(url, {useUnifiedTopology: true});
    await client.connect();
    const col = client.db("spider").collection(collectionname);
    const result = await col.insertOne(json);
    client.close();
    return result;
}

async function updateOne(collectionname,json1,json2){
    const client = new MongoClient(url, {useUnifiedTopology: true});
    await client.connect();
    const col = client.db("spider").collection(collectionname);
    const result = await col.updateOne(json1,{$set:json2});
    client.close();
    return result;
}

async function deleteOne(collectionname,json){
    const client = new MongoClient(url, {useUnifiedTopology: true});
    await client.connect();
    const col = client.db("spider").collection(collectionname);
    const result = await col.deleteOne(json);
    client.close();
    return result;
}

exports.find=find;
exports.insertOne=insertOne;
exports.updateOne=updateOne;
exports.deleteOne=deleteOne;

