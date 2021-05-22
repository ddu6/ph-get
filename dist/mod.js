"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.out = exports.log = void 0;
const fs = require("fs");
const path = require("path");
function getDate() {
    const date = new Date();
    return [date.getMonth() + 1, date.getDate()].map(val => val.toString().padStart(2, '0')).join('-') + ' ' + [date.getHours(), date.getMinutes(), date.getSeconds()].map(val => val.toString().padStart(2, '0')).join(':') + ':' + date.getMilliseconds().toString().padStart(3, '0');
}
function log(msg) {
    let string = getDate() + '  ';
    if (typeof msg !== 'string') {
        const { stack } = msg;
        if (stack !== undefined) {
            string += stack;
        }
        else {
            string += msg.message;
        }
    }
    else {
        string += msg;
    }
    string = string.replace(/\n */g, '\n                    ');
    fs.appendFileSync(path.join(__dirname, '../info/log.txt'), string + '\n\n');
    return string;
}
exports.log = log;
function out(msg) {
    const string = log(msg);
    console.log(string + '\n');
}
exports.out = out;
async function sleep(time) {
    await new Promise(resolve => {
        setTimeout(resolve, time * 1000);
    });
}
exports.sleep = sleep;
