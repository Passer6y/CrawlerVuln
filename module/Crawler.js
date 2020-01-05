const { Cluster } = require('puppeteer-cluster/dist/index');
const urllib = require('url');
const ScopeDB = require('./HandScope.js');
const CookieDB = require('./HandleCookies.js');
const fs = require('fs');

const launchOptions = {
    headless: true,
    ignoreHTTPSErrors: true,        // 忽略证书错误
    waitUntil: 'networkidle2',
    defaultViewport:{
        width: 1920,
        height: 1080
    },
    args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-xss-auditor',    // 关闭 XSS Auditor
        '--no-zygote',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-running-insecure-content',     // 允许不安全内容
        '--disable-webgl',
        '--disable-popup-blocking',
        //'--proxy-server=http://127.0.0.1:8080'      // 配置代理
    ],
    "executablePath": "Chromium_OSX.app/Contents/MacOS/Chromium",       // 配置chromium路径

};

const clusterLanuchOptions = {
    concurrency: Cluster.CONCURRENCY_PAGE,  // 单Chrome多tab模式
    maxConcurrency:  3,  // 并发的workers数
    retryLimit: 2,   // 重试次数
    skipDuplicateUrls: true,  // 不爬重复的url
    monitor: true,  // 显示性能消耗
    puppeteerOptions: launchOptions,
};

function get_src_and_href_links(nodes) {
    let result = [];
    for(let node of nodes){
        let src = node.getAttribute("src");
        let href = node.getAttribute("href");
        if (src){
            result.push(src)
        }
        if (href){
            result.push(href);
        }
    }
    return result;

}

async function notInScope(hostname) {
    const scopes = await ScopeDB.findScope();
    console.log("Current Scope:" + scopes);
    for(let scope of scopes){
        if(hostname.indexOf(scope) !== -1){
            return false;
        }
    }
    return true
}


async function parseLinks(links, url) {
    let result = [];
    let blacklists = ['css', 'js', 'jpg', 'png', 'gif', 'svg'];

    for(let link of links){
        let parsedLink = urllib.parse(link);
        let hostname = parsedLink.hostname;       // 主机名不带端口号

        // 处理相对路径
        if(hostname == null && link.indexOf("/") === 0){
            let old_link = link;
            link = urllib.resolve(url, link);
            console.log(`[*] relative url: ${old_link} => ${link}`);
        }
        // 相对路径还有一种是不以/开头的，如：resource.root/assets/images/favicon.ico

        // 处理url以 // 开头的情况
        if(link.indexOf("//") === 0){
            console.log(`[*] link start from "//" : ${link}`);
            link = "http:" + link;
        }

        // 去除静态文件
        if(parsedLink.pathname){
            let filename = parsedLink.pathname.split('/').pop();
            if(blacklists.indexOf(filename.split(".").pop()) !== -1){
                continue;
            }
        }

        if(link.indexOf("http") === -1){
            // 除上述情况外均为不合法URL,丢弃
            console.log(`[*] invalid link: ${link}`);
            continue;
        }


        // 检测是否在爬行范围
        parsedLink = urllib.parse(link);
        if(await notInScope(parsedLink.hostname)){
            console.log(`[*] Link not in scope: ${link}`);
            continue
        }

        result.push(link);

    }
    return result
}
async function preparePage(page){
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.navigator.chrome = {
            runtime: {},
            // etc.
        };
    });
}


function executeEvent() {
    var firedEventNames = ["focus", "mouseover", "mousedown", "click", "error"];
    var firedEvents = {};
    var length = firedEventNames.length;
    for (let i = 0; i < length; i++) {
        firedEvents[firedEventNames[i]] = document.createEvent("HTMLEvents");
        firedEvents[firedEventNames[i]].initEvent(firedEventNames[i], true, true);
    }
    var eventLength = window.eventNames.length;
    for (let i = 0; i < eventLength; i++) {
        var eventName =  window.eventNames[i].split("_-_")[0];
        var eventNode =  window.eventNodes[i];
        var index = firedEventNames.indexOf(eventName);
        if (index > -1) {
            if (eventNode != undefined) {
                eventNode.dispatchEvent(firedEvents[eventName]);
            }
        }
    }
    let result = window.info.split("_-_");
    result.splice(0,1);
    return result;
}


async function launchFromWebApi(targets) {
    const cluster = await Cluster.launch(clusterLanuchOptions);
    await cluster.task(async ({ page, data: url }) => {
        await preparePage(page);
        await page.setRequestInterception(true);     // 开启拦截功能
        await page.on('request', interceptedRequest => {
            // 拦截图片请求 => 返回假的图片资源
            // if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg') || interceptedRequest.url().endsWith('.gif'))
            //     interceptedRequest.abort();
            if (interceptedRequest.resourceType() === 'image' || interceptedRequest.url().endsWith('.ico')) {
                //console.log(`abort image: ${interceptedRequest.url()}`);
                let images = fs.readFileSync('public/image.png');
                interceptedRequest.respond({
                    'contentType': ' image/png',
                    'body': Buffer.from(images)
                });
            }
            else if(interceptedRequest.url().indexOf("logout") !== -1){
                interceptedRequest.abort();
            }
            else
                interceptedRequest.continue();
        });
        await page.on('dialog', async dialog => {
            await dialog.dismiss();
        });


        await page.on('response', interceptedResponse =>{
            let status = interceptedResponse.status();
            if(status.toString().substr(0,2) === "30"){
                console.log("url: " + interceptedResponse.url());
                console.log("status: " + status);
                console.log("headers: " + interceptedResponse.headers().location);

                // 添加进任务队列
                cluster.queue(interceptedResponse.headers().location);
            }
        });
        console.log("current url:" + url);
        // 加载Cookie
        const cookies = await CookieDB.findCookie(url);
        for(let cookie of cookies){
            page.setCookie({
                'name': cookie.name,
                'value': cookie.value,
                'domain': cookie.domain
            });
        }

        await page.goto(url, {
            timeout: 40 * 1000,
            waitUntil: 'networkidle2'
        });
        // 收集标签的URL
        const links = await page.$$eval('[src],[href],[action],[data-url],[longDesc],[lowsrc]', get_src_and_href_links);
        let urls = await parseLinks(links, url);
        //console.log("收集标签属性URL: " + urls);

        // 触发DOM事件&收集URL
        const domLinks = await page.evaluate(executeEvent);
        console.log(domLinks);
        const domUrls = await parseLinks(domLinks, url);
        console.log("收集DOM事件URL: " + domUrls);
        urls = domUrls.concat(urls);

        for(let url of urls){
            cluster.queue(url);
        }

    });

    for(let target of targets){
        if(target.indexOf("http") === -1){
            target = "http://" + target
        }
        cluster.queue(target);
    }


    await cluster.idle();
    await cluster.close();
}

module.exports = launchFromWebApi;
