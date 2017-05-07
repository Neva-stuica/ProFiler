'use strict'

//var regex = '(?:^[^\\w]*\\[[^\\]]+\\]|^[^\\w]*\\([^\\)]+\\)|^[^\\w]*(\\w+))'
var texte = '[Nosubs] Takagamonori 04 (1080p Blue-Ray AAC).mp4'

while (texte != '\0')
{
  var result = texte.match('(?:^[^a-zA-Z0-9\\(\\[]*((?:\\[[^\\]]+\\])|(?:\\([^\\)]+\\))|(?:\\w+)))')
  console.log(result[1])
  texte = texte.replace(result[0], '\0')
}
