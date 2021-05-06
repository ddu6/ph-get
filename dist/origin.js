"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPage = exports.getHole = exports.getComments = exports.getIP = void 0;
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const mod_1 = require("./mod");
const init_1 = require("./init");
Object.assign(init_1.config, JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), { encoding: 'utf8' })));
async function basicallyGet(url, params = {}, form = {}, cookie = '', referer = '', noUserAgent = false) {
    let paramsStr = new URL(url).searchParams.toString();
    if (paramsStr.length > 0) {
        paramsStr += '&';
    }
    paramsStr += new URLSearchParams(params).toString();
    if (paramsStr.length > 0) {
        paramsStr = '?' + paramsStr;
    }
    url = new URL(paramsStr, url).href;
    const formStr = new URLSearchParams(form).toString();
    const headers = {};
    if (cookie.length > 0) {
        headers.Cookie = cookie;
    }
    if (referer.length > 0) {
        headers.Referer = referer;
    }
    if (!noUserAgent) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';
    }
    if (formStr.length > 0) {
        Object.assign(headers, {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        });
    }
    const options = {
        method: formStr.length > 0 ? 'POST' : 'GET',
        headers: headers
    };
    const proxies = init_1.config.proxies;
    if (proxies.length > 0) {
        const i = Math.min(Math.floor(Math.random() * proxies.length), proxies.length - 1);
        const proxy = proxies[i];
        options.path = url;
        url = proxy;
    }
    const result = await new Promise((resolve) => {
        setTimeout(() => {
            resolve(500);
        }, init_1.config.timeout * 1000);
        const httpsOrHTTP = url.startsWith('https://') ? https : http;
        const req = httpsOrHTTP.request(url, options, async (res) => {
            const { statusCode } = res;
            if (statusCode === undefined) {
                resolve(500);
                return;
            }
            if (statusCode >= 400) {
                resolve(statusCode);
                return;
            }
            let cookie;
            const cookie0 = res.headers["set-cookie"];
            if (cookie0 === undefined) {
                cookie = '';
            }
            else {
                cookie = cookie0.map(val => val.split(';')[0]).join('; ');
            }
            let body = '';
            const buffers = [];
            res.on('data', chunk => {
                if (typeof chunk === 'string') {
                    body += chunk;
                }
                else if (chunk instanceof Buffer) {
                    body += chunk;
                    buffers.push(chunk);
                }
            });
            res.on('end', () => {
                resolve({
                    body: body,
                    buffer: Buffer.concat(buffers),
                    cookie: cookie,
                    headers: res.headers,
                    status: statusCode
                });
            });
            res.on('error', err => {
                mod_1.semilog(err);
                resolve(500);
            });
        }).on('error', err => {
            mod_1.semilog(err);
            resolve(500);
        });
        if (formStr.length > 0) {
            req.write(formStr);
        }
        req.end();
    });
    return result;
}
async function getResult(params = {}, form = {}) {
    Object.assign(params, {
        PKUHelperAPI: '3.0',
        jsapiver: '201027113050-449842'
    });
    const result = await basicallyGet('https://pkuhelper.pku.edu.cn/services/pkuhole/api.php', params, form);
    if (typeof result === 'number')
        return result;
    const { status, body } = result;
    if (status !== 200)
        return status;
    try {
        const { code, data, msg } = JSON.parse(body);
        if (code === 0)
            return { data: data };
        if (msg === '没有这条树洞')
            return 404;
        if (typeof msg === 'string' && msg.length > 0) {
            mod_1.semilog(msg);
        }
    }
    catch (err) {
        mod_1.semilog(err);
    }
    return 500;
}
async function getIP() {
    const result = await basicallyGet('http://ifconfig.me/all.json', {}, {}, '', '', true);
    if (typeof result === 'number')
        return result;
    const { status, body } = result;
    if (status !== 200)
        return status;
    return body;
}
exports.getIP = getIP;
async function getList(page, token) {
    const result = await getResult({
        action: 'getlist',
        p: page.toString(),
        user_token: token
    });
    return result;
}
async function getComments(id, token) {
    const result = await getResult({
        action: 'getcomment',
        pid: id.toString(),
        user_token: token
    });
    return result;
}
exports.getComments = getComments;
async function getHole(id, token) {
    const result = await getResult({
        action: 'getone',
        pid: id.toString(),
        user_token: token
    });
    return result;
}
exports.getHole = getHole;
async function getSearch(key, page, token) {
    const result = await getResult({
        action: 'search',
        pagesize: '50',
        page: page.toString(),
        keywords: key,
        user_token: token
    });
    return result;
}
async function getPage(key, page, token) {
    if (key.length === 0)
        return await getList(page, token);
    return await getSearch(key, page, token);
}
exports.getPage = getPage;
