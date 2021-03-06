import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as mysql from 'mysql'
import {HoleData,CommentData} from './origin'
import {config} from './init'
import { log } from './mod'
Object.assign(config,JSON.parse(fs.readFileSync(path.join(__dirname,'../config.json'),{encoding:'utf8'})))
const config0:mysql.PoolConfig=config.mysql
const config1:mysql.PoolConfig={
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: true,
    supportBigNumbers: true,
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../secrets/mysql/ca.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../secrets/mysql/client-cert.pem')),
        key: fs.readFileSync(path.join(__dirname, '../secrets/mysql/client-key.pem')),
        rejectUnauthorized: false
    }
}
Object.assign(config0,config1)
const pool=mysql.createPool(config0)
async function getResult(sen:string,vals:(string|number)[]){
    const result=await new Promise((resolve:(val:any[]|400|500)=>void)=>{
        pool.getConnection((err,con)=>{
            if(err){
                log(err)
                resolve(500)
                return
            }
            con.query(sen,vals,(err,result)=>{
                if(err){
                    log(err)
                    resolve(400)
                    return
                }
                resolve(result)
            })
            con.release()
        })
    })
    return result
}
export async function getInfo(){
    const result:{'max(pid)':number}[]|400|500=await getResult('select max(pid) from holes',[])
    if(result===400||result===500||result.length!==1)return 500
    const maxId=result[0]['max(pid)']
    const cresult:{'max(cid)':number}[]|400|500=await getResult('select max(cid) from comments',[])
    if(cresult===400||cresult===500||cresult.length!==1)return 500
    const maxCId=cresult[0]['max(cid)']
    return {
        maxId:maxId,
        maxCId:maxCId
    }
}
export async function getIds(start:number,step=10000){
    start*=step
    const result:{pid:number}[]|400|500=await getResult('select pid from holes where pid between ? and ?',[start,start+step-1])
    if(result===400||result===500)return 500
    return result.map(val=>val.pid)
}
export async function getCIds(start:number,step=10000){
    start*=step
    const result:{cid:number}[]|400|500=await getResult('select cid from comments where cid between ? and ?',[start,start+step-1])
    if(result===400||result===500)return 500
    return result.map(val=>val.cid)
}
export async function getComment(cid:number|string){
    const result:CommentData[]|400|500=await getResult('select * from comments where cid=? limit 1',[cid])
    if(result===400||result===500)return 500
    if(result.length===0)return 404
    return result[0]
}
export async function getComments(id:number|string){
    const result:CommentData[]|400|500=await getResult('select * from comments where pid=?',[id])
    if(result===400||result===500)return 500
    return result
}
export async function getOldComments(id:number|string){
    const result:CommentData[]|400|500=await getResult('select * from oldComments where pid=?',[id])
    if(result===400||result===500)return 500
    return result
}
export async function getHole(id:number|string){
    const result:HoleData[]|400|500=await getResult('select etimestamp,hidden,likenum,pid,reply,tag,text,timestamp,type,url from holes where pid=? limit 1',[id])
    if(result===400||result===500)return 500
    if(result.length===0)return 404
    return result[0]
}
export async function getPage(key:string,page:number,order:any,s:number,e:number){
    const vals=[]
    const conditions=[['timestamp!=0']]
    if(!isNaN(s)&&s>0){
        conditions[0].push(`${order==='liveness'?'e':''}timestamp>=?`)
        vals.push(s)
    }
    if(!isNaN(e)&&e>0){
        conditions[0].push(`${order==='liveness'?'e':''}timestamp<=?`)
        vals.push(e)
    }
    key=key.trim()
    if(key.length>0&&key.length<100){
        conditions[0].push('match(`fulltext`) against (? in boolean mode)')
        vals.push(key)
    }
    let conditionStr=conditions.map(val=>val.join(' and ')).join(' or ')
    if(conditionStr.length>0){
        conditionStr='where '+conditionStr
    }
    const orders:string[]=[]
    if(order==='heat'){
        orders.push('reply desc','likenum desc','pid desc')
    }else if(order==='liveness'){
        orders.push('etimestamp desc','cid desc')
    }else if(order==='span'){
        orders.push('span desc','pid desc')
    }else{
        orders.push('pid desc')
    }
    let orderStr=orders.join(',')
    if(orderStr.length>0){
        orderStr='order by '+orderStr
    }
    vals.push((page-1)*50)
    const result:HoleData[]|400|500=await getResult(`select etimestamp,hidden,likenum,pid,reply,tag,text,timestamp,type,url from holes ${conditionStr} ${orderStr} limit ?,50`,vals)
    if(result===400||result===500)return 500
    return result
}
export async function emptyHole(id:number|string){
    id=Number(id)
    const result0=await getResult('select pid from holes where pid>? limit 1',[id])
    if(result0===400||result0===500)return 500
    if(result0.length===0)return 404
    const result1=await getResult('select hidden from holes where pid=? limit 1',[id])
    if(result1===400||result1===500)return 500
    if(result1.length===0){
        const result2=await getResult('insert into holes (`pid`,`hidden`,`timestamp`,`etimestamp`,`text`,`fulltext`) values (?,?,?,?,?,?)',[id,1,0,0,'',id+'\n'])
        if(result2===400||result2===500)return 500
        return 200
    }
    const hidden=Number(result1[0].hidden)
    if(hidden===1)return 200
    const result2=await getResult('update holes set hidden=1 where pid=? limit 1',[id])
    if(result2===400||result2===500)return 500
    return 200
}
export async function updateHole(data:HoleData){
    if(data.text==='为保障树洞信息安全, 请前往树洞网页版进行人机验证, pkuhelper.pku.edu.cn/hole'){
        return 400
    }
    if(typeof data.tag!=='string')data.tag=''
    if(typeof data.text!=='string')data.text=''
    if(typeof data.url!=='string')data.url=''
    if(data.type=='image'){
        if(config.archive)await updateImg(data.url)
    }else if(data.type==='audio'){
        if(config.archive)await updateAudio(data.url)
    }else if(data.type!=='text'){
        data.type='text'
    }
    const id=Number(data.pid)
    const timestamp=Number(data.timestamp)
    const result0=await getResult('select pid from holes where pid=? limit 1',[id])
    if(result0!==400&&result0!==500&&result0.length===1){
        const result1=await getResult('update holes set tag=?,reply=?,likenum=? where pid=? limit 1',[data.tag,Number(data.reply),Number(data.likenum),id])
        if(result1===400||result1===500)return 500
        return 200
    }
    const result1=await getResult('replace into holes (`pid`,`tag`,`timestamp`,`reply`,`likenum`,`text`,`type`,`url`,`etimestamp`,`fulltext`) values (?,?,?,?,?,?,?,?,?,?)',[id,data.tag,timestamp,Number(data.reply),Number(data.likenum),data.text,data.type,data.url,timestamp,id+'\n'+data.text])
    if(result1===400||result1===500)return 500
    return 200
}
async function updateComment(data:CommentData,timestamp:number){
    if(typeof data.tag!=='string')data.tag=''
    if(typeof data.text!=='string')data.text=''
    if(typeof data.name!=='string')data.name=''
    if(data.text.startsWith('[Helper]'))return 423
    const cid=Number(data.cid)
    const pid=Number(data.pid)
    const etimestamp=Number(data.timestamp)
    const span=Math.max(0,etimestamp-timestamp)
    const result0=await getResult('select cid from comments where cid=? limit 1',[cid])
    if(result0!==400&&result0!==500&&result0.length===1)return 200
    const result1=await getResult('replace into comments (`cid`,`pid`,`tag`,`timestamp`,`text`,`name`) values (?,?,?,?,?,?)',[cid,pid,data.tag,etimestamp,data.text,data.name])
    const result2=await getResult('update holes set cid=?,etimestamp=?,span=?,`fulltext`=concat(`fulltext`,\'\\n\',?) where pid=? and cid<? limit 1',[cid,etimestamp,span,data.text,pid,cid])
    if(result1===400||result1===500||result2===400||result2===500)return 500
    return 200
}
export async function updateComments(id:number|string,data:CommentData[]){
    const result=await getHole(id)
    if(typeof result!=='number'){
        const timestamp=Number(result.timestamp)
        if(timestamp!==0){
            for(let i=0;i<data.length;i++){
                const item=data[i]
                const result=await updateComment(item,timestamp)
                if(result!==200)return result
            }
        }
    }
    return 200
}
async function updateFile(path0:string,url:string){
    if(fs.existsSync(path0))return 200
    const result=await new Promise((resolve:(val:number)=>void)=>{
        const req=https.get(url,res=>{
            if(res.statusCode===undefined){
                resolve(500)
                return
            }
            if(res.statusCode!==200){
                resolve(res.statusCode)
                return
            }
            res.on('error',err=>{
                log(err)
                resolve(500)
            })
            let stream
            try{
                stream=fs.createWriteStream(path0)
            }catch(err){
                log(err)
                resolve(500)
                return
            }
            stream.on('error',err=>{
                log(err)
                resolve(500)
            })
            res.on('end',()=>{
                resolve(200)
            })
            res.pipe(stream)
        })
    })
    return result
}
async function updateImg(url:string){
    const path0=path.join(__dirname,`../archive/imgs/${url}`)
    url=`https://pkuhelper.pku.edu.cn/services/pkuhole/images/${url}`
    return await updateFile(path0,url)
}
async function updateAudio(url:string){
    const path0=path.join(__dirname,`../archive/audios/${url}`)
    url=`https://pkuhelper.pku.edu.cn/services/pkuhole/audios/${url}`
    return await updateFile(path0,url)
}