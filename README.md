# browscli

<img src="https://raw.githubusercontent.com/h43z/browscli/master/logo.jpeg" width="340">

creates a unix socket that allows bidirectional communication with your browser.

Javascript code sent to the socket is evaluated in the browscli **extension context**.
The completion value of the evaluated code is send back through the socket.

This project makes use of [native messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).

First install the [extension](https://addons.mozilla.org/en-US/firefox/addon/browscli/). Next setup the native messaging manifest file.
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

Every browser profile will spawn its own native messaging host node script and
creates its own socket file at `/tmp/browscli.socket.*`.

Use whatever tools or programming languange you want to talk to this unix socket.

Examples of using basic linux tools
```sh
# eval 1+2 and read the response
echo '"1+2"' | nc -U /tmp/browscli.socket.0

# get list of browser tabs via the tabs.query api, quit after receiving
# response and make output pretty
echo '"browser.tabs.query({})"' | nc -U /tmp/browscli.socket.0 | head -1 | jq .

# inject content script into tab with id 60
echo '"browser.tabs.executeScript(60, {code:`alert(1)`})"' | nc -U /tmp/browscli.socket.0

# inject content script and break out of it via window.eval to get
# access dom and js variables of page loaded in tab with id 43
# https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#content_script_environment
echo '"browser.tabs.executeScript(43, {code:`window.eval(\"x\")`})"' | nc -U /tmp/browscli.socket.0

# tell browser to focus the tab with id 60
echo '"browser.tabs.update(60,{active: true})"' | nc -U /tmp/browscli.socket.0
```

Example of talking to the socket using nodejs
```js
const net = require('net')
const fs = require('fs')

const socket = net.createConnection('/tmp/browscli.socket.0', _ => {
  // code to get list of tabs
  const code = 'browser.tabs.query({})'
  // extension expects JSON
  socket.write(JSON.stringify(code))
})

let response = []
socket.on('data', data => {
  response.push(data)
  if(data.toString().endsWith('\n')){
    console.log('Received  from server:', response.join(""))
    response = []
  }
})
```
