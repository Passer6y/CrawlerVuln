# CrawlerVuln
一个NodeJS实现的漏扫动态爬虫
## 环境配置
1. 需要搭建一个MongoDB，去docker仓库拉一个即可，然后将在`module/Databases.js`第二行中修改数据库配置信息。
2. chromium修改版可以用`extension/`目录下的,也可以去这里下载：https://github.com/myvyang/chromium_for_spider/releases
3. 下载完成后，修改`module/Crawler.js`中的`launchOptions`参数，配置chromium路径以及代理选项
4. 安装同步Cookie的Chrome插件：Chrome选择More Tools->extension->load unpacked->选择文件夹`extension/syncookie`即可加载，接着浏览器右击选择插件`Start Sync Cookie`即可
5. 安装node环境依赖:`npm install`

> 配合文章食用更佳
