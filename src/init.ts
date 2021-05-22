import * as fs from 'fs'
import * as path from 'path'
[
    '../secrets/',
    '../secrets/mysql/',
    '../archive/',
    '../archive/imgs/',
    '../archive/audios/',
    '../info/'
].map(val=>path.join(__dirname,val)).forEach(val=>{
    if(!fs.existsSync(val))fs.mkdirSync(val)
})
export const config={
    passwords:[
        "xxxxxxxx"
    ],
    mysql:{
        host:"xxxxxxxx",
        user:"xxxxxxxx",
        password:"xxxxxxxx",
        database:"ph",
        port:3306,
    },
    archive:false,
    proxies:[
        "http://xx.xx.xx.xx:3128/"
    ],
    port:8080,
    timeout:30,
}
const path0=path.join(__dirname,'../config.json')
if(!fs.existsSync(path0))fs.writeFileSync(path0,JSON.stringify(config,null,4))