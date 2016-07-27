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

function create() {

  var buffer = ''
  var bytesReceived = 0
  var bytesExpected
  var hasHeader = false
  var ns = 0
  var nr = 0

  function encode(data, c) {
    try {
      var json = JSON.stringify(data)
      gzip(json, gz => {
        try {
          var body = foo(hex(gz))
          var prefix = createPrefix(body)
          var length = createLength(prefix, body)
          var result = prefix + length + body
          c(result)
        } catch (fail) {
          console.log(`error: ${fail}`)
        }
      })
    } catch (fail) {
      console.log(`encoding error: ${fail}`)
    }
  }

  function decode(data, c) {
    if (!data) return
    try {
      if (data instanceof Buffer) data = data.toString('utf-8')
      bytesReceived += data.length
      if (!hasHeader) {
        // we are currently reading the header
        buffer += data
        if (isHeaderComplete(buffer)) {
            // we have the header. parse it and begin reading the body
            buffer = removePrefix(buffer)
            bytesExpected = readLength(buffer)
            buffer = removeLength(buffer)
            hasHeader = true
        }
      } else {
        buffer += data
      }

      if (hasHeader && bytesReceived >= bytesExpected) {
        var tmp = buffer
        buffer = ''
        bytesReceived = 0
        bytesExpected = undefined
        hasHeader = false
        gunzip(unhex(unfoo(tmp)), json => {
          try {
            c(JSON.parse(json))
          } catch (fail) {
            console.log(`error: ${fail}`)
          }
        })
      }
    } catch (fail) {
      console.log(`decode error: ${fail}`)
    }
  }

  function hex(buf) {
    return buf.toString('hex')
  }

  function unhex(str) {
    return Buffer.from(str, 'hex')
  }

  function gzip(str, cb) {
    zlib.gzip(Buffer.from(str, 'utf-8'), (_, gz) => {
      cb(gz)
    })
  }

  function gunzip(buf, cb) {
    zlib.gunzip(buf, (_, gz) => {
      if (_) throw _
      cb(gz)
    })
  }

  function foo(str) {
    var junk = Buffer.alloc(str.length*3)
    for (var i = 0; i < str.length; ++i) {
      junk.write(h2j[str.charAt(i)], i * 3)
    }
    return junk.toString()
  }

  function unfoo(str) {
    if (str.length % 3)
      throw 'wat'

    var out = Buffer.alloc(str.length/3)
    for (var i = 0; i < str.length; i += 3) {
      var sub = str.substr(i,3)
      if (!j2h[sub]) throw 'ahhh hell no'
      out.write(j2h[sub], i/3)
    }
    return out.toString()
  }

  function createPrefix(str) {
    var p = Object.keys(S)[str.length % 4]
    var n = S[p]
    for (var i = 0; i < n; ++i)
      p += Object.keys(S)[Math.floor(Math.random() * 4)]
    return p
  }

  function removePrefix(str) {
    var n = S[str.charAt(0)]
    if (n === undefined)
      throw '?'
    return str.substr(n+1)
  }

  function createLength(prefix, body) {
    var l = (prefix.length + 24 + body.length).toString()
    return foo('00000000'.substr(l.length) + l)
  }

  function removeLength(str) {
    return str.substr(24)
  }

  function readLength(str) {
    if (str.length < 24) throw '%'
    return Number.parseInt(unfoo(str.substr(0,24)))
  }

  function isHeaderComplete(h) {
    if (!h.length) return false
    var n = S[h.charAt(0)]
    return h.length >= n + 1 + 24
  }

  return {
    e: encode,
    d: decode
  }
}

module.exports = {
  create: create
}
