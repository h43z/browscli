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
