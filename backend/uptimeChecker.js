import { STATUS_CODES } from 'http';
import fetch from 'node-fetch';

let processes = {}
const uptimeWebhookUrl = process.env.UPTIME_WEBHOOK_URL;

function addProcess(pid,url) {
    processes[pid] = {pid,url,status:0}
}
addProcess('LiveScratch',`https://localhost:${process.env.PORT}/`)

function checkAll() {
    Object.keys(processes).forEach(pid=>check(pid))
}
checkAll()
setInterval(checkAll,1000 * 60) // check every minute! 

async function check(processId) {
    let status;
    let process = processes[processId]
    try { 
        let response = await fetch(process.url)
        status = response.status 
    }
    catch(e) { status = e.message }
    
    if(process.status != status) {
        process.status = status;
        notify(process)
    }
}
check('LiveScratch')

function getStatusText(status) {
    return STATUS_CODES[status] ? status + ': ' + STATUS_CODES[status] : status;
}

function notify(process) {
    let capitalizedName = process.pid.replace(process.pid[0],process.pid[0].toUpperCase())
    let statusText = getStatusText(process.status)
    let message = process.status == 200 ? 
    `:white_check_mark: :sunglasses: ${capitalizedName} is back up and running :white_check_mark:\n\`${statusText}\``
    : `:rotating_light: :dizzy_face: ${capitalizedName} server is down! The request threw the following error :point_down::rotating_light:\n\`${statusText}\` <@1202288505007382658>`

    fetch(uptimeWebhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:message})}).then(res=>res.text().then(text=>console.log(text)))
}