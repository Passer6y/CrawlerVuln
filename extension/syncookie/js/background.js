var currenturl;
var status = false;



chrome.contextMenus.create({
    title: "Start Sync Cookie",
    id: "Sync Cookie",
    onclick: function(){
        if (status === 'true') {
            chrome.contextMenus.update('Sync Cookie', {title: 'Start Sync Cookie'} , function(){});
            status = false;
        }else{
            chrome.contextMenus.update('Sync Cookie', {title: 'Stop Sync Cookie'} , function(){});
            status = true;
        }
    }
});

function updateCookie(domain, name , value){
    let api = "http://127.0.0.1:3000/add-cookie";
    $.post(api, {
        "domain": domain,
        "name": name,
        "value": value,
    }, function (data, status) {
        console.log(status);
    });
}

/*
 * doc: https://developer.chrome.com/extensions/cookies
 */

chrome.cookies.onChanged.addListener((changeInfo) =>{
    // 记录Cookie增加，Cookie更新分两步，第一步先删除，第二步再增加
    if(changeInfo.removed === false){
        updateCookie(changeInfo.cookie.domain, changeInfo.cookie.name, changeInfo.cookie.value);
    }
});


