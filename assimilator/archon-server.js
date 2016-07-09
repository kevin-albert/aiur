'use strict'

const PORT = 9027
const COMMANDS = ['ls', 'use', 'info', 'exec']

const proto = require('./protocol')
const router = require('./router')
const zealots = require('./zealot-server')
const namer = require('./namer')
const logger = require('./logger')('archon')

function handleSocket(socket) {
  var archonID = null
  socket.onMessage(msg => {
    if (validate(archonID, msg)) {
      if (!archonID) {
        archonID = msg.archonID
        logger.info(`archon ${archonID} connected`)
        router.connect(archonID, socket)
      }
      switch (msg.cmd) {
        case 'ls':
          socket.send({cmd: 'ls', 'zealots': zealots.ls()})
          break
        case 'info':
          socket.send({cmd: 'info', zealot: zealots.getByName(msg.arg)})
          break
        case 'use':
          let zealot = zealots.getByName(msg.arg)
          let response = {
            cmd: 'use',
            zealotID: zealot ? zealot.zealotID : null,
            name: zealot ? namer.getName(zealot.zealotID) : null
          }
          socket.send(response)
          break
        case 'exec':
          let instruction = {
            archonID: msg.archonID,
            exec: msg.arg
          }
          router.sendMessage(msg.zealotID, instruction)
          break
      }
    }
  })
}

function validate(archonID, msg) {
  var fail = false
  if (!msg.archonID) {
    fail = `missing archonID`
  } else if (archonID && archonID != msg.archonID) {
    fail = `provided archonID (${msg.archonID}) does not match existing (${archonID})`
  }

  if (!fail) {
    if (!msg.cmd) {
      fail = `missing command: ${JSON.stringify(msg)}`
    } else if (!COMMANDS.find(cmd => cmd == msg.cmd)) {
      fail = `invalid command: '${msg.cmd}'`
    }
  }

  if (!fail) {
    if ((msg.cmd == 'use' || msg.cmd == 'exec') && !msg.arg) {
      fail = `missing arg: ${JSON.stringify(msg)}`
    } else if (msg.cmd == 'exec' && !msg.zealotID) {
      fail = `missing zealotID: ${JSON.stringify(msg)}`
    }
  }

  if (fail) {
    logger.error(`message validation error - archon: ${archonID}, error ${fail}`)
    return false
  } else {
    return true
  }
}

proto.createServer(PORT, handleSocket)
