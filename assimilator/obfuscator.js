const zlib = require('zlib')

const h2j = {
  '0': '   ',
  '1': ';  ',
  '2': '  \n',
  '3': '; \n',
  '4': '  \t',
  '5': '; \t',
  '6': ' \n ',
  '7': ';\n ',
  '8': ' \n\n',
  '9': ';\n\n',
  'a': ' \n\t',
  'b': ';\n\t',
  'c': ' \t ',
  'd': ';\t ',
  'e': ' \t\n',
  'f': ';\t\n'
}

const S = {
  ' ': 4,
  '\t': 2,
  '\n': 11,
  ';': 3
}

var j2h = {}
Object.keys(h2j)
  .map(c => {return {k: c, v: h2j[c]}})
  .forEach(o => j2h[o.v] = o.k)

function E(data, c) {
  var json = JSON.stringify(data)
  zlib.gzip(Buffer.from(json, 'utf-8'), (_, gz) => {
    var hex = gz.toString('hex')
    var junk = Buffer.alloc(hex.length*3)
    for (var i = 0; i < hex.length; ++i) {
      junk.write(h2j[hex.charAt(i)], i * 3)
    }
    var prefix = Object.keys(S)[junk.length % 4]
    var text = prefix
    for (var i = 0; i < S[prefix]; ++i) {
      text += Object.keys(S)[Math.floor(Math.random() * 4)]
    }
    c(text + junk.toString())
  })
}

function D(data, c) {
  if (data instanceof Buffer) data = data.toString('utf-8')
  var junk = data.substr(S[data.charAt(0)]+1)
  var hex = Buffer.alloc(junk.length/3)
  for (var i = 0; i < junk.length; i += 3) {
    hex.write(j2h[junk.substr(i, 3)], i/3)
  }
  zlib.gunzip(Buffer.from(hex.toString(), 'hex'), (_, result) => {
    c(JSON.parse(result.toString()))
  })
}

module.exports = {
  e: E,
  d: D
}
