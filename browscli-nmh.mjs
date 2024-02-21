#!/usr/bin/env node
import { unlink, access } from 'node:fs/promises'
import { createServer } from 'net'

let msgLen = 0
let dataLen = 0
let input = []

process.stdin.on('readable', _ => {
  let chunk
  while(chunk = process.stdin.read()){
    if (msgLen === 0 && dataLen === 0){
      msgLen = chunk.readUInt32LE(0)
      chunk = chunk.subarray(4)
    }
    dataLen += chunk.length
    input.push(chunk)
    if(dataLen === msgLen){
      if(clients.length){
        clients.forEach(client => {
          client.write(Buffer.concat(input).toString() + '\n')
        })
      }
      msgLen = 0
      dataLen = 0
      input = []
    }
  }
})

process.on('SIGTERM', async _ => {
  await unlink(socketFile)
})

process.on('uncaughtException', err => {
  sendMessage({error: err.toString()})
})

const sendMessage = json => {
  let buffer = Buffer.from(JSON.stringify(json))
  let header = Buffer.alloc(4)
  header.writeUInt32LE(buffer.length, 0)
  let data = Buffer.concat([header, buffer])
  process.stdout.write(data)
}

const clients = []
const server = createServer(con => {
  clients.push(con)

  con.on('data', data => {
    const json = JSON.parse(data.toString())
    sendMessage(json)
  })

  con.on('end', _ => {
    const index = clients.indexOf(con)
    if(index !== -1) {
      clients.splice(index, 1)
    }
  })
})

let found = false
let socketFile

try{
  for(let i = 0; i < 10; i++){
    socketFile = `/tmp/browscli.socket.${i}`
    await access(socketFile)
  }
}catch{
  found = true
}

if(!found)
  process.exit(1)

server.listen(socketFile)
