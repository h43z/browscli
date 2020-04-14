const WebSocket = require('ws')
const wss = new WebSocket.Server({
  port: 8080
})

const extensions = {}
const clients = {}

wss.on('connection', ws => {
  ws.on('message', event => {
    let message
    try{
      message = JSON.parse(event) 
    }catch(e){
      console.error('Cannot parse json from extension')
      return
    }

    console.log(message)

    if(message.source === 'extension' && message.data.cmd === 'ready'){
      extensions[message.from] = ws
      return
    }else if(message.source == 'extension' && message.to && clients[message.to]){
      clients[message.to].send(JSON.stringify(message))
    }else if(message.source == 'client' && message.to && extensions[message.to]){
      clients[message.from] = ws
      extensions[message.to].send(JSON.stringify(message))
    }
  })
})
