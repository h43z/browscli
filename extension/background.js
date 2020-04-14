const isChrome = /Chrome/.test(navigator.userAgent)
const isFirefox = /Firefox/.test(navigator.userAgent)

let browserApi 

if(isFirefox){
  browserApi = browser
}else if(isChrome){
  browserApi = chrome
}

function createContentScript(code){
  return `
    new Promise(resolve => {
      var s = document.createElement('script');
      s.text = \`
        try{
          var response = eval(\\\`${code}\\\`);
        }catch(e){
          var response = e.message
        }
        document.currentScript.dispatchEvent(new CustomEvent('eval', {
          detail: response
        }));
        document.currentScript.parentElement.removeChild(document.currentScript);
       \`;
      s.addEventListener('eval', e => {
        resolve(e.detail)
      })
      document.documentElement.prepend(s);
    })
  `
}

const commands = {
  async ls(){
    if(isFirefox){
      return browser.tabs.query({})
    }else if(isChrome){
      return new Promise((resolve, reject) => {
        chrome.tabs.query({}, result => {
          resolve(result)
        })
      })
    }
  },
  async inject(tabId, code, runAt='document_end'){
    if(isFirefox){
      return browser.tabs.executeScript(parseInt(tabId), {
        code: createContentScript(code),
        runAt
      })
    }else if(isChrome){
      return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(parseInt(tabId), {
          code: createContentScript(code),
          runAt
        }, result => {
          resolve(result)
        })
      })
    }
  }
}

function getOptions(){
  if(isChrome){
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['address', 'browserId'], result => {
        resolve(result)
      })
    })
  }else if(isFirefox){
    return browser.storage.local.get(['address', 'browserId'])
  }
}

async function setup(){
  const options = await getOptions()
  const socket = new WebSocket(options.address)

  function send(data, to=null){
    socket.send(JSON.stringify({
      from: options.browserId,
      source: 'extension',
      to,
      data
    })) 
  }

  async function run(message){
    if(!message.data.cmd)
      return

    let response
    try{
      response = await commands[message.data.cmd](...(message.data.args || []))
      send(response, message.from)
    }catch(e){
      response = [e.message]
    }

    send(response, message.from)
  }

  socket.addEventListener('open', event => {
    send({
      cmd: 'ready' 
    })
  })

  socket.addEventListener('message', async event => {
    console.log(event.data)
    try{
      let message = JSON.parse(event.data) 
      run(message)
    }catch(e){
      console.error('Cannot parse json from server')
      return
    }
  })
}

browserApi.runtime.onInstalled.addListener(details => {
  if(details.reason != 'install')
    return

  // set default options
  browserApi.storage.local.set({
    address: 'ws://localhost:8080',
    browserId:  Math.random().toString(36).substring(7)
  })
})

setup()
