import * as fs from 'fs'
import * as path from 'path'
const path0=path.join(__dirname,'../secrets/')
const path1=path.join(__dirname,'../secrets/mysql/')
const path2=path.join(__dirname,'../config.json')
const path3=path.join(__dirname,'../archive/')
const path4=path.join(__dirname,'../archive/imgs/')
const path5=path.join(__dirname,'../archive/audios/')
if(!fs.existsSync(path0)){
    fs.mkdirSync(path0)
}
if(!fs.existsSync(path1)){
    fs.mkdirSync(path1)
}
if(!fs.existsSync(path3)){
    fs.mkdirSync(path3)
}
if(!fs.existsSync(path4)){
    fs.mkdirSync(path4)
}
if(!fs.existsSync(path5)){
    fs.mkdirSync(path5)
}
if(!fs.existsSync(path2)){
    fs.writeFileSync(path2,
`{
    "server":{
        "port":8080,
        "proxies":[
            "http://xx.xx.xx.xx:3128/"
        ],
        "password":"xxxxxxxx"
    },
    "mysql":{
        "host":"xxxxxxxx",
        "port":3306,
        "user":"xxxxxxxx",
        "password":"xxxxxxxx",
        "database":"ph"
    },
    "archive":false
}
`)
}