const namer = require('./namer')

var zealots = {}
var typers = {}
var ids = {}

// TESTING
zealots['12345678'] = {
  status: 'FAKE',
  connected: new Date(),
  data: {ip: '8.8.8.8'},
  name: namer.getName('12345678')
}

function connect(id, data, socket) {
  var zealot = zealots[id]
  if (zealot) {
    zealot.status = 'READY'
    zealot.connected = new Date()
    zealot.data = data
    zealot.socket = socket
  } else {
    zealot = zealots[id] = {
      id: id,
      name: namer.getName(id),
      status: 'READY',
      connected: new Date(),
      data: data
    }
  }
  console.log(`zealot ${zealot.id} connected`)
}

function disconnect(id) {
  if (id) {
    var zealot = zealots.find((e) => e.hostname == hostname)
    if (zealot) {
      zealot.status = 'DOWN'
      zealot.disconnected = new Date()
      zealot.socket = null
      console.log(`zealot ${zealot.id} disconnected`)
    }
  }
}

module.exports = {
  handleSocket: function(socket) {
    var id = null
    socket.on('data', (data) => {
      var msg = JSON.parse(data)
      if (!id) {
        id = msg.id
        connect(id, msg.data, socket)
      }


      if (msg.cmd == 'print' && zealots[id] && channels[msg.tid]) {
        typers[msg.tid].o({kind: msg.kind, text: msg.text})
      } else {
        console.log(`id: ${id}, bad message: ${msg}`)
      }
    })
    socket.on('close', () => disconnect(id))
  },

  lookup: function(name) {
    return zealots[namer.getId(name)]
  },

  list: function() {
    return Object.keys(zealots).map(id => zealots[id])
  }
}
