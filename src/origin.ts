import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import {semilog} from './mod'
import {config} from './init'
Object.assign(config,JSON.parse(fs.readFileSync(path.join(__dirname,'../config.json'),{encoding:'utf8'})))
interface Res{
    body:string
    buffer:Buffer
    cookie:string
    headers:http.IncomingHttpHeaders
    status:number
}
export interface HoleData{
    text:string|null|undefined
    tag:string|null|undefined
    pid:number|string
    timestamp:number|string
    reply:number|string
    likenum:number|string
    type:string|null|undefined
    url:string|null|undefined
    hidden:'1'|'0'|1|0|boolean
}
export interface CommentData{
    text:string|null|undefined
    tag:string|null|undefined
    cid:number|string
    pid:number|string
    timestamp:number|string
    name:string|null|undefined
}
async function basicallyGet(url:string,params:Record<string,string>={},form:Record<string,string>={},cookie='',referer='',noUserAgent=false){
    let paramsStr=new URL(url).searchParams.toString()
    if(paramsStr.length>0){
        paramsStr+='&'
    }
    paramsStr+=new URLSearchParams(params).toString()
    if(paramsStr.length>0){
        paramsStr='?'+paramsStr
    }
    url=new URL(paramsStr,url).href
    const formStr=new URLSearchParams(form).toString()
    const headers:http.OutgoingHttpHeaders={}
    if(cookie.length>0){
        headers.Cookie=cookie
    }
    if(referer.length>0){
        headers.Referer=referer
    }
    if(!noUserAgent){
        headers['User-Agent']='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
    }
    if(formStr.length>0){
        Object.assign(headers,{
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        })
    }
    const options:https.RequestOptions={
        method:formStr.length>0?'POST':'GET',
        headers:headers
    }
    const proxies=config.proxies
    if(proxies.length>0){
        const i=Math.min(Math.floor(Math.random()*proxies.length),proxies.length-1)
        const proxy=proxies[i]
        options.path=url
        url=proxy
    }
    const result=await new Promise((resolve:(val:number|Res)=>void)=>{
        setTimeout(()=>{
            resolve(500)
        },config.timeout*1000)
        const httpsOrHTTP=url.startsWith('https://')?https:http
        const req=httpsOrHTTP.request(url,options,async res=>{
            const {statusCode}=res
            if(statusCode===undefined){
                resolve(500)
                return
            }
            if(statusCode>=400){
                resolve(statusCode)
                return
            }
            let cookie:string
            const cookie0=res.headers["set-cookie"]
            if(cookie0===undefined){
                cookie=''
            }else{
                cookie=cookie0.map(val=>val.split(';')[0]).join('; ')
            }
            let body=''
            const buffers:Buffer[]=[]
            res.on('data',chunk=>{
                if(typeof chunk==='string'){
                    body+=chunk
                }else if(chunk instanceof Buffer){
                    body+=chunk
                    buffers.push(chunk)
                }
            })
            res.on('end',()=>{
                resolve({
                    body:body,
                    buffer:Buffer.concat(buffers),
                    cookie:cookie,
                    headers:res.headers,
                    status:statusCode
                })
            })
            res.on('error',err=>{
                semilog(err)
                resolve(500)
            })
        }).on('error',err=>{
            semilog(err)
            resolve(500)
        })
        if(formStr.length>0){
            req.write(formStr)
        }
        req.end()
    })
    return result
}
async function getResult(params:Record<string,string>={},form:Record<string,string>={}){
    Object.assign(params,{
        PKUHelperAPI:'3.0',
        jsapiver:'201027113050-449842'
    })
    const result=await basicallyGet('https://pkuhelper.pku.edu.cn/services/pkuhole/api.php',params,form)
    if(typeof result==='number')return result
    const {status,body}=result
    if(status!==200)return status
    try{
        const {code,data,msg}=JSON.parse(body)
        if(code===0)return {data:data}
        if(msg==='没有这条树洞')return 404
        if(typeof msg==='string'&&msg.length>0){
            semilog(msg)
        }
    }catch(err){
        semilog(err)
    }
    return 500
}
export async function getIP(){
    const result=await basicallyGet('http://ifconfig.me/all.json',{},{},'','',true)
    if(typeof result==='number')return result
    const {status,body}=result
    if(status!==200)return status
    return body
}
export async function star(id:number|string,starred:boolean,token:string){
    const result=await getResult({
        action:'attention',
        pid:id.toString(),
        switch:starred?'0':'1',
        user_token:token
    })
    if(typeof result==='number')return result
    return 200
}
async function getList(page:number|string,token:string){
    const result:{data:HoleData[]}|number=await getResult({
        action:'getlist',
        p:page.toString(),
        user_token:token
    })
    return result
}
export async function getComments(id:number|string,token:string){
    const result:{data:CommentData[]}|number=await getResult({
        action:'getcomment',
        pid:id.toString(),
        user_token:token
    })
    return result
}
export async function getHole(id:number|string,token:string){
    const result:{data:HoleData}|number=await getResult({
        action:'getone',
        pid:id.toString(),
        user_token:token
    })
    return result
}
async function getSearch(key:string,page:number|string,token:string){
    const result:{data:HoleData[]}|number=await getResult({
        action:'search',
        pagesize:'50',
        page:page.toString(),
        keywords:key,
        user_token:token
    })
    return result
}
export async function getStars(token:string){
    const result:{data:HoleData[]}|number=await getResult({
        action:'getattention',
        user_token:token
    })
    return result
}
export async function getPage(key:string,page:number|string,token:string){
    if(key.length===0)return await getList(page,token)
    return await getSearch(key,page,token)
}
export async function comment(id:number|string,text:string,token:string){
    const result=await getResult({
        action:'docomment',
        user_token:token
    },{
        pid:id.toString(),
        text:text,
        user_token:token
    })
    if(typeof result==='number')return result
    return 200
}