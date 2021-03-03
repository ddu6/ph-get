"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPage = exports.getStars = exports.getHole = exports.getComments = exports.star = exports.getIP = void 0;
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const proxies = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), { encoding: 'utf8' })).server.proxies;
async function basicallyGetResult(url) {
    const data = await new Promise((resolve) => {
        try {
            const httpsOrHTTP = url.startsWith('https://') ? https : http;
            let url0;
            let options;
            if (proxies.length === 0) {
                url0 = url;
                options = {};
            }
            else {
                const i = Math.min(Math.floor(Math.random() * proxies.length), proxies.length - 1);
                const proxy = proxies[i];
                url0 = proxy;
                options = { path: url };
            }
            const req = httpsOrHTTP.get(url0, options, res => {
                if (res.statusCode === undefined) {
                    resolve(500);
                    return;
                }
                if (res.statusCode !== 200) {
                    resolve(res.statusCode);
                    return;
                }
                let data = '';
                res.on('error', err => {
                    console.log(err);
                    resolve(500);
                });
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(data);
                });
            });
        }
        catch (err) {
            console.log(err);
            resolve(500);
        }
    });
    return data;
}
async function getResult(url) {
    const data = await basicallyGetResult(url);
    if (typeof data !== 'string')
        return data;
    try {
        const json = JSON.parse(data);
        if (json.code !== 0)
            return 404;
        return { data: json.data };
    }
    catch (err) {
        console.log(err);
        return 500;
    }
}
async function getIP() {
    const result = await basicallyGetResult('http://ifconfig.me/all.json');
    return result;
}
exports.getIP = getIP;
async function star(id, starred, token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=attention&pid=${id}&switch=${starred ? '0' : '1'}&PKUHelperAPI=3.0&jsapiver=201027113050-446530&user_token=${token}`);
    if (typeof result === 'number')
        return result;
    return 200;
}
exports.star = star;
async function getList(page, token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getlist&p=${page}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`);
    return result;
}
async function getComments(id, token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getcomment&pid=${id}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`);
    return result;
}
exports.getComments = getComments;
async function getHole(id, token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getone&pid=${id}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`);
    return result;
}
exports.getHole = getHole;
async function getSearch(key, page, token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=search&pagesize=50&page=${page}&keywords=${encodeURIComponent(key)}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`);
    return result;
}
async function getStars(token) {
    const result = await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getattention&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`);
    return result;
}
exports.getStars = getStars;
async function getPage(key, page, token) {
    if (key.length === 0)
        return await getList(page, token);
    return await getSearch(key, page, token);
}
exports.getPage = getPage;
