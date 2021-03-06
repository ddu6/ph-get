"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const origin = require("./origin");
const local = require("./local");
const fs = require("fs");
const path = require("path");
const http = require("http");
const init_1 = require("./init");
Object.assign(init_1.config, JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), { encoding: 'utf8' })));
let maxId = 100000;
let maxCId = 100000;
const oldCommentsThreshold = 32859;
const passwords = init_1.config.passwords;
if (passwords.length === 0)
    throw new Error('Please fill in passwords in config.json.');
const password = passwords[0];
const tokenToInfo = {};
const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json;charset=utf-8");
    if (req.method !== 'GET' && req.method !== 'POST' || req.url === undefined) {
        res.end();
        return;
    }
    const url = new URL(req.url, 'https://pkuhelper.pku.edu.cn');
    const path0 = decodeURIComponent(url.pathname);
    const params = url.searchParams;
    const password0 = params.get('password');
    if (password0 === null || !passwords.includes(password0)) {
        res.end(JSON.stringify({ status: 403 }));
        return;
    }
    if (path0.startsWith('/local')) {
        const token = params.get('token');
        if (typeof token !== 'string' || token.length !== 32) {
            res.end(JSON.stringify({ status: 401 }));
            return;
        }
        const now = Math.floor(Date.now() / 1000);
        const info = tokenToInfo[token] ?? (tokenToInfo[token] = {
            expirationTime: 0,
            searching: false,
        });
        if (info.expirationTime < now) {
            const result = await origin.getHole(maxId, token);
            if (typeof result === 'number') {
                res.end(JSON.stringify({ status: 401 }));
                return;
            }
            info.expirationTime = now + 2592000;
        }
        const path1 = path0.slice(6);
        if (path1 === '/info') {
            const data = await local.getInfo();
            if (data === 500) {
                res.end(JSON.stringify({ status: 500 }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/ids')) {
            const start = Number(path1.slice(4));
            if (isNaN(start)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            const data = await local.getIds(start);
            if (data === 500) {
                res.end(JSON.stringify({ status: 500 }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/cids')) {
            const start = Number(path1.slice(5));
            if (isNaN(start)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            const data = await local.getCIds(start);
            if (data === 500) {
                res.end(JSON.stringify({ status: 500 }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/cs')) {
            const pid = Number(path1.slice(3));
            if (isNaN(pid)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            if (pid > maxId) {
                res.end(JSON.stringify({ status: 200, data: [] }));
                return;
            }
            if (pid <= oldCommentsThreshold) {
                const data = await local.getOldComments(pid);
                if (data === 500) {
                    res.end(JSON.stringify({ status: 500 }));
                    return;
                }
                res.end(JSON.stringify({ status: 200, data: data }));
                return;
            }
            const data = await local.getComments(pid);
            if (data === 500) {
                res.end(JSON.stringify({ status: 500 }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/c')) {
            const cid = Number(path1.slice(2));
            if (isNaN(cid)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            if (cid > maxCId) {
                res.end(JSON.stringify({ status: 404 }));
                return;
            }
            const data = await local.getComment(cid);
            if (data === 500 || data === 404) {
                res.end(JSON.stringify({ status: data }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/h')) {
            const pid = Number(path1.slice(2));
            if (isNaN(pid)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            if (pid > maxId) {
                res.end(JSON.stringify({ status: 200, data: {
                        text: '',
                        tag: '',
                        pid: pid,
                        timestamp: 0,
                        reply: 0,
                        likenum: 0,
                        type: 'text',
                        url: '',
                        hidden: 1
                    } }));
                return;
            }
            const data = await local.getHole(pid);
            if (data === 500 || data === 404) {
                res.end(JSON.stringify({ status: data }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        if (path1.startsWith('/p')) {
            const page = Number(path1.slice(2));
            if (isNaN(page)) {
                res.end(JSON.stringify({ status: 400 }));
                return;
            }
            let key = params.get('key');
            if (typeof key !== 'string') {
                key = '';
            }
            if (key.length > 0) {
                if (info.searching) {
                    res.end(JSON.stringify({ status: 503 }));
                    return;
                }
                info.searching = true;
            }
            const order = params.get('order');
            const s = Number(params.get('s'));
            const e = Number(params.get('e'));
            const data = await local.getPage(key, page, order, s, e);
            if (key.length > 0) {
                info.searching = false;
            }
            if (data === 500) {
                res.end(JSON.stringify({ status: 500 }));
                return;
            }
            res.end(JSON.stringify({ status: 200, data: data }));
            return;
        }
        res.end(JSON.stringify({ status: 400 }));
        return;
    }
    if (password0 !== password) {
        res.end(JSON.stringify({ status: 403 }));
        return;
    }
    if (path0 === '/ip') {
        const result = await origin.getIP();
        if (typeof result === 'number') {
            res.end(JSON.stringify({ status: result }));
            return;
        }
        res.end(`{"status":200,"data":${result}}`);
        return;
    }
    const token = params.get('token');
    if (typeof token !== 'string' || token.length !== 32) {
        res.end(JSON.stringify({ status: 401 }));
        return;
    }
    if (path0.startsWith('/cs')) {
        const pid = Number(path0.slice(3));
        if (isNaN(pid)) {
            res.end(JSON.stringify({ status: 400 }));
            return;
        }
        if (pid > maxId || pid <= oldCommentsThreshold) {
            res.end(JSON.stringify({ status: 404 }));
            return;
        }
        const result = await origin.getComments(pid, token);
        if (typeof result === 'number') {
            res.end(JSON.stringify({ status: result }));
            return;
        }
        const data = result.data;
        if (data.length > 0) {
            const cid = Math.max(Number(data[0].cid), Number(data[data.length - 1].cid));
            if (cid > maxCId) {
                maxCId = cid;
            }
        }
        if (params.has('update')) {
            const result = await local.updateComments(pid, data);
            if (result !== 200) {
                res.end(JSON.stringify({ status: result }));
                return;
            }
        }
        res.end(JSON.stringify({ status: 200, data: data }));
        return;
    }
    if (path0.startsWith('/h')) {
        const pid = Number(path0.slice(2));
        if (isNaN(pid)) {
            res.end(JSON.stringify({ status: 400 }));
            return;
        }
        if (pid > maxId || pid <= oldCommentsThreshold) {
            res.end(JSON.stringify({ status: 404 }));
            return;
        }
        const result = await origin.getHole(pid, token);
        if (result === 404) {
            if (params.has('update')) {
                const result = await origin.getHole(maxId, token);
                if (typeof result !== 'number') {
                    await local.emptyHole(pid);
                }
            }
            res.end(JSON.stringify({ status: 404 }));
            return;
        }
        if (typeof result === 'number') {
            res.end(JSON.stringify({ status: result }));
            return;
        }
        const data = result.data;
        if (params.has('update')) {
            const result = await local.updateHole(data);
            if (result === 500) {
                res.end(JSON.stringify({ status: result }));
                return;
            }
        }
        res.end(JSON.stringify({ status: 200, data: data }));
        return;
    }
    if (path0.startsWith('/p')) {
        const page = Number(path0.slice(2));
        if (isNaN(page)) {
            res.end(JSON.stringify({ status: 400 }));
            return;
        }
        let key = params.get('key');
        if (typeof key !== 'string') {
            key = '';
        }
        const result = await origin.getPage(key, page, token);
        if (typeof result === 'number') {
            res.end(JSON.stringify({ status: result }));
            return;
        }
        const data = result.data;
        if (key === '' && page === 1 && data.length > 0) {
            const pid = Number(data[0].pid);
            if (pid > maxId) {
                maxId = pid;
            }
        }
        if (params.has('update')) {
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const result = await local.updateHole(item);
                if (result === 500) {
                    res.end(JSON.stringify({ status: result }));
                    return;
                }
            }
        }
        res.end(JSON.stringify({ status: 200, data: data }));
        return;
    }
    res.end(JSON.stringify({ status: 400 }));
});
server.listen(init_1.config.port);
