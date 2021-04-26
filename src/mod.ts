import * as fs from 'fs'
import * as path from 'path'
function getDate(){
    const date=new Date()
    return [date.getMonth()+1,date.getDate()].map(val=>val.toString().padStart(2,'0')).join('-')+' '+[date.getHours(),date.getMinutes(),date.getSeconds()].map(val=>val.toString().padStart(2,'0')).join(':')+':'+date.getMilliseconds().toString().padStart(3,'0')
}
export function semilog(msg:string|Error){
    let string=getDate()+'  '
    if(typeof msg!=='string'){
        const {stack}=msg
        if(stack!==undefined){
            string+=stack
        }else{
            string+=msg.message
        }
    }else{
        string+=msg
    }
    string=string.replace(/\n */g,'\n                    ')
    fs.appendFileSync(path.join(__dirname,'../info/semilog.txt'),string+'\n\n')
    return string
}
export function log(msg:string|Error){
    const string=semilog(msg)
    console.log(string+'\n')
}
export async function sleep(time:number){
    await new Promise(resolve=>{
        setTimeout(resolve,time*1000)
    })
}