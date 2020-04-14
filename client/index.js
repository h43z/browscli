const WebSocket = require('ws')
const path = require('path')

if(!process.argv[2] && !process.argv[3]){
  console.log('node', path.basename(__filename),'<browserid>', '<cmd>', '<args>')
  process.exit()
}

const browserId = process.argv[2]
const cmd = process.argv[3]
const args = process.argv.slice(4)
const clientId = Math.random().toString(36).substring(7)

function send(data){
  ws.send(JSON.stringify({
    source: 'client',
    from: clientId,
    to: browserId,
    data
  }))
}

const ws = new WebSocket('ws://localhost:8080')

ws.on('open', open => {
  send({
    cmd,
    args
  })
})

ws.on('message', data => {
  console.log(JSON.stringify(JSON.parse(data), null, 2))
  process.exit()
})

