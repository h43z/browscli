const isChrome = /Chrome/.test(navigator.userAgent)
const isFirefox = /Firefox/.test(navigator.userAgent)

let browserApi 

if(isFirefox){
  browserApi = browser
}else if(isChrome){
  browserApi = chrome
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

function saveOptions(e){
  e.preventDefault()
  browserApi.storage.local.set({
    address: document.querySelector('#address').value,
    browserId: document.querySelector('#browserid').value
  })

  alert('restart browser')
}

async function restoreOptions(){
  let options = await getOptions()

  document.querySelector('#address').value = options.address
  document.querySelector('#browserid').value = options.browserId
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.querySelector('form').addEventListener('submit', saveOptions)
