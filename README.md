# browscli

![Image of browscli](https://raw.githubusercontent.com/h43z/browscli/master/logo.jpeg)

Start server, install extension, send commdands with client.

Get `browserid` from extension preferences in browser.
Client has 2 commands ls (list tabs with lots of info) and inject (inject code into website).
```
cd client
node index.js browserid ls
node index.js browserid inject tabid "window.location.href"

```

demo -> https://twitter.com/h43z/status/1249489052103061507

Browscli "breaks out" of the sandbox context of a extension to have full 
(read/write) access to the DOM and window object.

The fun happens here in the extension
```
// code string is coming from the client cli

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

return browser.tabs.executeScript(parseInt(tabId), {
  code: createContentScript(code),
  runAt
})
```

browser.tabs.executeScript allows an extension to inject string that gets
evaluated in a content script. Content scripts though run in their own
safe context (security feature, so websites cannot mess with extensions).
To "bypass" this and gain full access to the underlying website the content script
will dynamically create script element and inject it into the the actual website.
The scripts element javascript code will then `eval` the user provided code from
the cli propagate the response back.
