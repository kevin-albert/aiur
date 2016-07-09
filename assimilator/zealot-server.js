'use strict'

// constants
const PORT = 9026
const IDLE_TIMEOUT =    300000 // 5 min
const DEAD_TIMEOUT =  86400000 // 1 day
const CLEANUP_INTERVAL = 60000 // 1 min

// import modules
const net = require('net')
const proto = require('./protocol')
const namer = require('./namer')
const router = require('./router')
const logger = require('./logger')('zealot')

var zealots = {}

function occasionalCleanup() {
  Object.keys(zealots).forEach(id => {
    let diff = Date.now() - zealots[id].lastCheckIn.getTime()
    if (diff >= DEAD_TIMEOUT) {
      // this guy hasn't checked in for a long time
      // remove him from the list
      delete zealots[id]
    } else if (diff >= IDLE_TIMEOUT) {
      // this guy hasn't checked in for a few minutes
      // mark him as down
      zealots[id].state = 'DOWN'
    }
  })
}

function validate(zealotID, msg) {
  var fail = false
  if (zealotID) {
    if (msg.zealotID != zealotID) {
      fail = `message ID '${msg.zealotID}' does not match existing '${zealotID}'`
    }
  } else {
    if (!msg.zealotID) {
      fail = `zealot checked in with no ID. message: ${JSON.stringify(msg)}`
    }
  }

  if (msg.output) {
    if (!msg.archonID) {
      fail = `output message missing archonID: ${JSON.stringify(msg)}`
    } else if (typeof msg.output != 'object' || !msg.output.kind || !msg.output.data) {
      fail = `malformed output object. message: ${JSON.stringify(msg)}`
    }
  }

  if (fail) {
    logger.error(`message validation error: ${fail}`)
    return false
  } else {
    return true
  }
}

function checkIn(msg, socket) {
  var zealot = zealots[msg.zealotID]
  if (zealot) {
    zealot.lastCheckIn = new Date()
    zealot.state = 'UP'
  } else {
    zealot = {
      zealotID: msg.zealotID,
      lastCheckIn: new Date(),
      state: 'UP',
      connected: new Date(),
      name: namer.getName(msg.zealotID)
    }
    zealots[msg.zealotID] = zealot
  }
  router.connect(msg.zealotID, socket)
}

function relayData(msg) {
  let message = {
    cmd: 'print',
    name: namer.getName(msg.zealotID),
    kind: msg.output.kind,
    data: msg.output.data
  }
  router.sendMessage(msg.archonID, message)
}

function handleSocket(socket) {
  var zealotID = null

  socket.onMessage(msg => {
    if (validate(zealotID, msg)) {
      zealotID = msg.zealotID
      checkIn(msg, socket)
      if (msg.output)
        relayData(msg)
    }
  })
}

proto.createServer(PORT, handleSocket)

function ls() {
  return Object.keys(zealots)
    .map(zealotID => zealots[zealotID])
    .map(z => {
      return {
        zealotID: z.zealotID,
        name: z.name,
        lastCheckIn: z.lastCheckIn,
        state: z.state,
        connected: z.connected
      }
    })
}

function getById(zealotID) {
  return zealots[zealotID]
}

function getByName(name) {
  let zealotID = namer.getId(name)
  return zealotID ? getById(zealotID) : undefined
}

setInterval(occasionalCleanup, CLEANUP_INTERVAL)

module.exports = {
  ls: ls,
  getById: getById,
  getByName: getByName
}
