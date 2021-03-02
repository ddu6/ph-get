import * as https from 'https'
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
async function getResult(url:string){
    const data=await new Promise((resolve:(val:string|number)=>void)=>{
        try{
            const req=https.get(url,res=>{
                if(res.statusCode===undefined){
                    resolve(500)
                    return
                }
                if(res.statusCode!==200){
                    resolve(res.statusCode)
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
            })
        }catch(err){console.log(err);resolve(500)}
    })
    if(typeof data!=='string')return data
    try{
        const json:{code:0|1,data:any}=JSON.parse(data)
        if(json.code!==0)return 404
        return {data:json.data}
    }catch(err){console.log(err);return 500}
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