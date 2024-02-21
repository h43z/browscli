const port = browser.runtime.connectNative('browscli')

const commands = {
  async list(){
    return browser.tabs.query({})
  },
  async inject(tabId, code, runAt='document_end', allFrames=false){
    return browser.tabs.executeScript(parseInt(tabId), {
      code: createContentScript(code),
      runAt,
      allFrames
    })
  },
  async focus(tabId){
    return browser.tabs.update(tabId, {
      active: true
    })
  }
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

port.onMessage.addListener(async json => {
  const response  = await commands[json.cmd](...(json.args || []))
  port.postMessage(response)
})
