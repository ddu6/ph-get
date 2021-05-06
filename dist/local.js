"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = exports.updateHole = exports.emptyHole = exports.getPage = exports.getHole = exports.getOldComments = exports.getComments = exports.getCIds = exports.getIds = exports.getInfo = void 0;
const fs = require("fs");
const path = require("path");
const https = require("https");
const mysql = require("mysql");
const init_1 = require("./init");
const mod_1 = require("./mod");
Object.assign(init_1.config, JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), { encoding: 'utf8' })));
const config0 = init_1.config.mysql;
const config1 = {
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: true,
    supportBigNumbers: true,
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../secrets/mysql/ca.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../secrets/mysql/client-cert.pem')),
        key: fs.readFileSync(path.join(__dirname, '../secrets/mysql/client-key.pem')),
        rejectUnauthorized: false
    }
};
Object.assign(config0, config1);
const pool = mysql.createPool(config0);
async function getResult(sen, vals) {
    const result = await new Promise((resolve) => {
        pool.getConnection((err, con) => {
            if (err) {
                mod_1.semilog(err);
                resolve(500);
                return;
            }
            con.query(sen, vals, (err, result) => {
                if (err) {
                    mod_1.semilog(err);
                    resolve(400);
                    return;
                }
                resolve(result);
            });
            con.release();
        });
    });
    return result;
}
async function getInfo() {
    const result = await getResult('select max(pid) from holes', []);
    if (result === 400 || result === 500 || result.length !== 1)
        return 500;
    const maxId = result[0]['max(pid)'];
    const cresult = await getResult('select max(cid) from comments', []);
    if (cresult === 400 || cresult === 500 || cresult.length !== 1)
        return 500;
    const maxCId = cresult[0]['max(cid)'];
    return {
        maxId: maxId,
        maxCId: maxCId
    };
}
exports.getInfo = getInfo;
async function getIds(start, step = 10000) {
    start *= step;
    const result = await getResult('select pid from holes where pid between ? and ?', [start, start + step - 1]);
    if (result === 400 || result === 500)
        return 500;
    return result.map(val => val.pid);
}
exports.getIds = getIds;
async function getCIds(start, step = 10000) {
    start *= step;
    const result = await getResult('select cid from comments where cid between ? and ?', [start, start + step - 1]);
    if (result === 400 || result === 500)
        return 500;
    return result.map(val => val.cid);
}
exports.getCIds = getCIds;
async function getComments(id) {
    const result = await getResult('select * from comments where pid=?', [id]);
    if (result === 400 || result === 500)
        return 500;
    return result;
}
exports.getComments = getComments;
async function getOldComments(id) {
    const result = await getResult('select * from oldComments where pid=?', [id]);
    if (result === 400 || result === 500)
        return 500;
    return result;
}
exports.getOldComments = getOldComments;
async function getHole(id) {
    const result = await getResult('select etimestamp,hidden,likenum,pid,reply,tag,text,timestamp,type,url from holes where pid=?', [id]);
    if (result === 400 || result === 500)
        return 500;
    if (result.length === 0)
        return 404;
    return result[0];
}
exports.getHole = getHole;
async function getPage(key, page, order, s, e) {
    const conditions = [['timestamp!=0']];
    const vals = [];
    if (!isNaN(s) && s > 0) {
        conditions[0].push(`${order === 'active' ? 'e' : ''}timestamp>=?`);
        vals.push(s);
    }
    if (!isNaN(e) && e > 0) {
        conditions[0].push(`${order === 'active' ? 'e' : ''}timestamp<=?`);
        vals.push(e);
    }
    key = key.trim();
    if (key.length > 0 && key.length < 100) {
        conditions[0].push('match(`fulltext`) against (? in boolean mode)');
        vals.push(key);
    }
    const conditionStr = conditions.map(val => val.join(' and ')).join(' or ');
    vals.push((page - 1) * 50);
    const result = await getResult(`select etimestamp,hidden,likenum,pid,reply,tag,text,timestamp,type,url from holes ${conditionStr.length > 0 ? 'where ' : ''}${conditionStr} order by ${order === 'hot' ? 'reply desc,likenum desc,' : ''}${order === 'active' ? 'etimestamp desc,cid desc,' : ''}pid desc limit ?,50`, vals);
    if (result === 400 || result === 500)
        return 500;
    return result;
}
exports.getPage = getPage;
async function emptyHole(id) {
    id = Number(id);
    const result0 = await getResult('select pid from holes where pid>? limit 1', [id]);
    if (result0 === 400 || result0 === 500)
        return 500;
    if (result0.length === 0)
        return 404;
    const result1 = await getResult('select hidden from holes where pid=? limit 1', [id]);
    if (result1 === 400 || result1 === 500)
        return 500;
    if (result1.length === 0) {
        const result2 = await getResult('insert into holes (`pid`,`tag`,`timestamp`,`reply`,`likenum`,`text`,`type`,`url`,`etimestamp`,`hidden`,`fulltext`) values (?,?,?,?,?,?,?,?,?,?,?)', [id, '', 0, 0, 0, '', 'text', '', 0, 1, id + '\n']);
        if (result2 === 400 || result2 === 500)
            return 500;
        return 200;
    }
    const hidden = Number(result1[0].hidden);
    if (hidden === 1)
        return 200;
    const result2 = await getResult('update holes set hidden=1 where pid=? limit 1', [id]);
    if (result2 === 400 || result2 === 500)
        return 500;
    return 200;
}
exports.emptyHole = emptyHole;
async function updateHole(data) {
    if (typeof data.tag !== 'string')
        data.tag = '';
    if (typeof data.text !== 'string')
        data.text = '';
    if (typeof data.url !== 'string')
        data.url = '';
    if (data.type == 'image') {
        if (init_1.config.archive)
            await updateImg(data.url);
    }
    else if (data.type === 'audio') {
        if (init_1.config.archive)
            await updateAudio(data.url);
    }
    else {
        if (data.text === '为保障树洞信息安全, 请前往树洞网页版进行人机验证, pkuhelper.pku.edu.cn/hole') {
            return 400;
        }
        if (typeof data.type !== 'string') {
            data.type = 'text';
        }
    }
    const id = Number(data.pid);
    const timestamp = Number(data.timestamp);
    const result0 = await getResult('select pid from holes where pid=?', [id]);
    if (result0 !== 400 && result0 !== 500 && result0.length === 1) {
        const result1 = await getResult('update holes set tag=?,reply=?,likenum=? where pid=?', [data.tag, Number(data.reply), Number(data.likenum), id]);
        if (result1 === 400 || result1 === 500)
            return 500;
        return 200;
    }
    const result1 = await getResult('replace into holes (`pid`,`tag`,`timestamp`,`reply`,`likenum`,`text`,`type`,`url`,`etimestamp`,`fulltext`) values (?,?,?,?,?,?,?,?,?,?)', [id, data.tag, timestamp, Number(data.reply), Number(data.likenum), data.text, data.type, data.url, timestamp, id + '\n' + data.text]);
    if (result1 === 400 || result1 === 500)
        return 500;
    return 200;
}
exports.updateHole = updateHole;
async function updateComment(data) {
    if (typeof data.tag !== 'string')
        data.tag = '';
    if (typeof data.text !== 'string')
        data.text = '';
    if (typeof data.name !== 'string')
        data.name = '';
    if (data.text.startsWith('[Helper]'))
        return 423;
    const cid = Number(data.cid);
    const pid = Number(data.pid);
    const timestamp = Number(data.timestamp);
    const result0 = await getResult('select cid from comments where cid=?', [cid]);
    if (result0 !== 400 && result0 !== 500 && result0.length === 1)
        return 200;
    const result1 = await getResult('replace into comments (`cid`,`pid`,`tag`,`timestamp`,`text`,`name`) values (?,?,?,?,?,?)', [cid, pid, data.tag, timestamp, data.text, data.name]);
    const result2 = await getResult('update holes set cid=?,etimestamp=?,`fulltext`=concat(`fulltext`,\'\\n\',?) where pid=? and cid<? limit 1', [cid, timestamp, data.text, pid, cid]);
    if (result1 === 400 || result1 === 500 || result2 === 400 || result2 === 500)
        return 500;
    return 200;
}
exports.updateComment = updateComment;
async function updateFile(path0, url) {
    if (fs.existsSync(path0))
        return 200;
    const result = await new Promise((resolve) => {
        const req = https.get(url, res => {
            if (res.statusCode === undefined) {
                resolve(500);
                return;
            }
            if (res.statusCode !== 200) {
                resolve(res.statusCode);
                return;
            }
            res.on('error', err => {
                mod_1.semilog(err);
                resolve(500);
            });
            let stream;
            try {
                stream = fs.createWriteStream(path0);
            }
            catch (err) {
                mod_1.semilog(err);
                resolve(500);
                return;
            }
            stream.on('error', err => {
                mod_1.semilog(err);
                resolve(500);
            });
            res.on('end', () => {
                resolve(200);
            });
            res.pipe(stream);
        });
    });
    return result;
}
async function updateImg(url) {
    const path0 = path.join(__dirname, `../archive/imgs/${url}`);
    url = `https://pkuhelper.pku.edu.cn/services/pkuhole/images/${url}`;
    return await updateFile(path0, url);
}
async function updateAudio(url) {
    const path0 = path.join(__dirname, `../archive/audios/${url}`);
    url = `https://pkuhelper.pku.edu.cn/services/pkuhole/audios/${url}`;
    return await updateFile(path0, url);
}
