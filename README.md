# browscli

<img src="https://raw.githubusercontent.com/h43z/browscli/master/logo.jpeg" width="340">

Send commands to you browser from the terminal. Get a list of tabs or inject
code into websites and more. Code is held to a minimum to be easily readable.

This project makes use of [native messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).

First install the extension. Next setup the native messaging manifest file.
(This is an example for linux ubuntu and firefox)

```
cat << EOF >> ~/.mozilla/native-messaging-hosts/browscli.json
{
  "name": "browscli",
  "description": "browscli native message proxy",
  "path": "$PWD/browscli-nmh.mjs",
  "type": "stdio",
  "allowed_extensions": [ "browscli@h43z" ]
}
EOF

# if you run firefox from snap/flatpak you have to give it this permission
flatpak permission-set webextensions browscli snap.firefox yes
```

Make sure you set the right path to the `browscli-nmh.mjs` nodejs script.

Every browser instance with a setup native messaging manifest will start the
browscli native messaging host node script when started. The extension can then
talk to this script. The script creates a unix socket file `/tmp/browscli.socket.*`.

You can use this socket to send commands to the extension and receive the response.
Use whatever tools you want to talk to this unix socket.

```
# using netcat to connect to socket and providing the input via stdin.
# piping the output through jq

echo '{"cmd":"list"}' | nc -U /tmp/browscli.socket.0 | jq .

# injection js code into tab with id 24
# making use of timeout to automatically close netcat after one second
echo '{"cmd":"inject", "args": [24, "location.href"]}' | timeout 1 nc -U /tmp/browscli.socket.0

# extracting all tab titles and urls with jq
echo '{"cmd":"list"}' | timeout 1 nc -U /tmp/browscli.socket.0 | jq -r '.[] | "\(.title) \(.url)"'

# focusing tab with id 5
# sending command against another browser instace of firefox
echo '{"cmd":"focus", "args": [5]}' | timeout 1 nc -U /tmp/browscli.socket.1
```

Every browser instance will spawn it's on native messaging host application and
also use a seperate socket file.


Browscli "breaks out" of the sandbox context of a extension to have full (read/write)
access to the DOM and window object of a website.

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
