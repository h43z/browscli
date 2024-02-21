cat << EOF >> ~/.mozilla/native-messaging-hosts/browscli.json
{
  "name": "browscli",
  "description": "browscli native message proxy",
  "path": "$PWD/browscli-nmh.mjs",
  "type": "stdio",
  "allowed_extensions": [ "browscli@h43z" ]
}
EOF

flatpak permission-set webextensions browscli snap.firefox yes
