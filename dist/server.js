"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const origin = require("./origin");
const local = require("./local");
const fs = require("fs");
const path = require("path");
const http = require("http");
let maxId = 0;
const oldCommentsThreshold = 32859;
const { port } = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), { encoding: 'utf8' })).server;
const server = http.createServer(async (req, res) => {
    try {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/json;charset=utf-8");
        if (req.method !== 'GET' && req.method !== 'POST' || req.url === undefined) {
            res.end();
            return;
        }
        const url = new URL(req.url, 'https://pkuhelper.pku.edu.cn');
        const path0 = decodeURIComponent(url.pathname);
        const params = url.searchParams;
        if (path0.startsWith('/local')) {
            const path1 = path0.slice(6);
            if (path1.startsWith('/ids')) {
                const start = Number(path1.slice(4));
                if (isNaN(start)) {
                    res.statusCode = 400;
                    res.end();
                    return;
                }
                const data = await local.getIds(start);
                if (data === 500) {
                    res.statusCode = 500;
                    res.end();
                    return;
                }
                res.end(JSON.stringify(data));
                return;
            }
            if (path1.startsWith('/cids')) {
                const start = Number(path1.slice(5));
                if (isNaN(start)) {
                    res.statusCode = 400;
                    res.end();
                    return;
                }
                const data = await local.getCIds(start);
                if (data === 500) {
                    res.statusCode = 500;
                    res.end();
                    return;
                }
                res.end(JSON.stringify(data));
                return;
            }
            if (path1.startsWith('/c')) {
                const pid = Number(path1.slice(2));
                if (isNaN(pid)) {
                    res.statusCode = 400;
                    res.end();
                    return;
                }
                if (pid > maxId) {
                    res.end(JSON.stringify([]));
                    return;
                }
                if (pid <= oldCommentsThreshold) {
                    const data = await local.getOldComments(pid);
                    if (data === 500) {
                        res.statusCode = 500;
                        res.end();
                        return;
                    }
                    res.end(JSON.stringify(data));
                    return;
                }
                const data = await local.getComments(pid);
                if (data === 500) {
                    res.statusCode = 500;
                    res.end();
                    return;
                }
                res.end(JSON.stringify(data));
                return;
            }
            if (path1.startsWith('/h')) {
                const pid = Number(path1.slice(2));
                if (isNaN(pid)) {
                    res.statusCode = 400;
                    res.end();
                    return;
                }
                if (pid > maxId) {
                    res.end(JSON.stringify({
                        text: '',
                        tag: '',
                        pid: pid,
                        timestamp: 0,
                        reply: 0,
                        likenum: 0,
                        type: 'text',
                        url: '',
                        hidden: 1
                    }));
                    return;
                }
                const data = await local.getHole(pid);
                if (data === 500 || data === 404) {
                    res.statusCode = data;
                    res.end();
                    return;
                }
                res.end(JSON.stringify(data));
                return;
            }
            if (path1.startsWith('/p')) {
                const page = Number(path1.slice(2));
                if (isNaN(page)) {
                    res.statusCode = 400;
                    res.end();
                    return;
                }
                let key = params.get('key');
                if (typeof key !== 'string') {
                    key = '';
                }
                const order = params.get('order');
                const s = Number(params.get('s'));
                const e = Number(params.get('e'));
                const data = await local.getPage(key, page, order, s, e);
                if (data === 500) {
                    res.statusCode = 500;
                    res.end();
                    return;
                }
                res.end(JSON.stringify(data));
                return;
            }
            res.statusCode = 400;
            res.end();
            return;
        }
        const token = params.get('token');
        if (typeof token !== 'string' || token.length === 0) {
            res.statusCode = 401;
            res.end();
            return;
        }
        if (path0 === '/s') {
            const result = await origin.getStars(token);
            if (typeof result === 'number') {
                res.statusCode = result;
                res.end();
                return;
            }
            const data = result.data;
            res.end(JSON.stringify(data));
            if (params.has('update')) {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    await local.updateHole(item);
                }
            }
            return;
        }
        if (path0.startsWith('/s')) {
            const pid = Number(path0.slice(2));
            if (isNaN(pid)) {
                res.statusCode = 400;
                res.end();
                return;
            }
            if (pid > maxId) {
                res.statusCode = 404;
                res.end();
                return;
            }
            const result = await origin.star(pid, params.has('starred'), token);
            res.statusCode = result;
            res.end();
            return;
        }
        if (path0.startsWith('/c')) {
            const pid = Number(path0.slice(2));
            if (isNaN(pid)) {
                res.statusCode = 400;
                res.end();
                return;
            }
            if (pid > maxId || pid <= oldCommentsThreshold) {
                res.statusCode = 404;
                res.end();
                return;
            }
            const result = await origin.getComments(pid, token);
            if (typeof result === 'number') {
                res.statusCode = result;
                res.end();
                return;
            }
            const data = result.data;
            res.end(JSON.stringify(data));
            if (params.has('update')) {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    await local.updateComment(item);
                }
            }
            return;
        }
        if (path0.startsWith('/h')) {
            const pid = Number(path0.slice(2));
            if (isNaN(pid)) {
                res.statusCode = 400;
                res.end();
                return;
            }
            if (pid > maxId) {
                res.statusCode = 404;
                res.end();
                return;
            }
            const result = await origin.getHole(pid, token);
            if (result === 404) {
                res.statusCode = 404;
                res.end();
                if (params.has('update')) {
                    const result = await origin.getHole(1309735, token);
                    if (typeof result === 'number')
                        return;
                    await local.emptyHole(pid);
                }
                return;
            }
            if (typeof result === 'number') {
                res.statusCode = result;
                res.end();
                return;
            }
            const data = result.data;
            res.end(JSON.stringify(data));
            if (params.has('update')) {
                await local.updateHole(data);
            }
            return;
        }
        if (path0.startsWith('/p')) {
            const page = Number(path0.slice(2));
            if (isNaN(page)) {
                res.statusCode = 400;
                res.end();
                return;
            }
            let key = params.get('key');
            if (typeof key !== 'string') {
                key = '';
            }
            const result = await origin.getPage(key, page, token);
            if (typeof result === 'number') {
                res.statusCode = result;
                res.end();
                return;
            }
            const data = result.data;
            res.end(JSON.stringify(data));
            if (params.has('update')) {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    await local.updateHole(item);
                }
            }
            if (key === '' && page === 1 && data.length > 0) {
                const { pid } = data[0];
                if (pid > maxId)
                    maxId = Number(pid);
            }
            return;
        }
        res.statusCode = 400;
        res.end();
    }
    catch (err) {
        console.log(err);
    }
});
server.listen(port);
