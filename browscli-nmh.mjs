#!/usr/bin/env node
import { unlink, access, chmod } from 'node:fs/promises'
import { createServer } from 'net'

let msgLen = 0
let dataLen = 0
let input = []

const events = ['SIGINT','SIGTERM']

events.forEach(signal => {
  process.on(signal, async _ => {
    try{
      await unlink(socketFile)
    }catch(error){}

    process.exit(0)
  })
})

process.stdin.on('readable', _ => {
  let chunk
  while(chunk = process.stdin.read()){
    if(msgLen === 0 && dataLen === 0){
      msgLen = chunk.readUInt32LE(0)
      chunk = chunk.subarray(4)
    }
    dataLen += chunk.length
    input.push(chunk)
    if(dataLen === msgLen){
      clients?.forEach(client => {
        client.write(Buffer.concat(input).toString() + '\n')
      })
      msgLen = 0
      dataLen = 0
      input = []
    }
  }
})

process.on('uncaughtException', error => {
  sendMessage({error: error.toString()})
})

const sendMessage = json => {
  let buffer = Buffer.from(JSON.stringify(json))
  let header = Buffer.alloc(4)
  header.writeUInt32LE(buffer.length, 0)
  let data = Buffer.concat([header, buffer])
  process.stdout.write(data)
}

const clients = []
const server = createServer(client => {
  clients.push(client)

  client.on('data', data => {
    const json = JSON.parse(data.toString())
    sendMessage(json)
  })

  client.on('end', _ => {
    const index = clients.indexOf(client)
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

server.listen(socketFile, async _ => {
  await chmod(socketFile, 0o600)
})
