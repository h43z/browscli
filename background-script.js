const port = browser.runtime.connectNative('browscli')

port.onMessage.addListener(async code => {
  try{
    console.log(`eval:`, code)
    let result = await eval(code)
    console.log(`result:`, result)
    port.postMessage(result)
  }catch(error){
    console.log(`error:`, error)
    port.postMessage(error.message)
  }
})
