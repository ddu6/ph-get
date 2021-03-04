import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
const proxies:string[]=JSON.parse(fs.readFileSync(path.join(__dirname,'../config.json'),{encoding:'utf8'})).server.proxies
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
async function basicallyGetResult(url:string){
    const data=await new Promise((resolve:(val:string|number)=>void)=>{
        try{
            let url0:string
            let options:https.RequestOptions
            if(proxies.length===0){
                url0=url
                options={}
            }else{
                const i=Math.min(Math.floor(Math.random()*proxies.length),proxies.length-1)
                const proxy=proxies[i]
                url0=proxy
                options={path:url}
            }
            const httpsOrHTTP=url0.startsWith('https://')?https:http
            const req=httpsOrHTTP.get(url0,options,res=>{
                const {statusCode}=res
                if(statusCode===undefined){
                    resolve(500)
                    return
                }
                if(statusCode!==200){
                    resolve(statusCode)
                    return
                }
                let data=''
                res.on('error',err=>{
                    console.log(err)
                    resolve(500)
                })
                res.on('data',chunk=>{
                    data+=chunk
                })
                res.on('end',()=>{
                    resolve(data)
                })
            }).on('error',err=>{
                console.log(err)
                resolve(500)
            })
        }catch(err){
            console.log(err)
            resolve(500)
        }
    })
    return data
}
async function getResult(url:string){
    const data=await basicallyGetResult(url)
    if(typeof data!=='string')return data
    try{
        const json:{code:0|1,data:any}=JSON.parse(data)
        if(json.code!==0)return 404
        return {data:json.data}
    }catch(err){console.log(err);return 500}
}
export async function getIP(){
    const result=await basicallyGetResult('http://ifconfig.me/all.json')
    return result
}
export async function star(id:number|string,starred:boolean,token:string){
    const result=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=attention&pid=${id}&switch=${starred?'0':'1'}&PKUHelperAPI=3.0&jsapiver=201027113050-446530&user_token=${token}`)
    if(typeof result==='number')return result
    return 200
}
async function getList(page:number|string,token:string){
    const result:{data:HoleData[]}|number=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getlist&p=${page}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`)
    return result
}
export async function getComments(id:number|string,token:string){
    const result:{data:CommentData[]}|number=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getcomment&pid=${id}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`)
    return result
}
export async function getHole(id:number|string,token:string){
    const result:{data:HoleData}|number=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getone&pid=${id}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`)
    return result
}
async function getSearch(key:string,page:number|string,token:string){
    const result:{data:HoleData[]}|number=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=search&pagesize=50&page=${page}&keywords=${encodeURIComponent(key)}&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`)
    return result
}
export async function getStars(token:string){
    const result:{data:HoleData[]}|number=await getResult(`https://pkuhelper.pku.edu.cn/services/pkuhole/api.php?action=getattention&PKUHelperAPI=3.0&jsapiver=201027113050-446532&user_token=${token}`)
    return result
}
export async function getPage(key:string,page:number|string,token:string){
    if(key.length===0)return await getList(page,token)
    return await getSearch(key,page,token)
}