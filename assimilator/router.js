'use strict'

const BUFFER_MAX = 1000

const logger = require('./logger')('router')
const units = {}

function getUnit(id, socket) {
  if (!units[id]) {
    units[id] = {
      id: id,
      buffer: []
    }
  }

  if (socket) {
    units[id].socket = socket
  }

  return units[id]
}

function sendMessage(id, msg) {
  let unit = getUnit(id)
  if (unit.socket) {
    doSend(unit, msg, 3)
  } else {
    unit.buffer.push(msg)
    if (unit.buffer.length > BUFFER_MAX) {
      unit.buffer.splice(0,BUFFER_MAX-unit.buffer.length)
      logger.error(`buffer overflow for ${id}!`)
    }
  }
}

function doSend(unit, msg, retries, callback) {
  unit.socket.send(msg, error => {
    if (error) {
      logger.error(`sending message to ${unit.id
      }: ${JSON.stringify(error)}`)
      if (retries) {
        // retry
        doSend(unit, msg, retries-1, callback)
      } else {
        // fail
        void(callback && callback(error))
      }
    } else {
      void(callback && callback())
    }
  })
}

function flush(unit, callback) {
  if (unit.socket) {
    if (unit.buffer.length) {
      var msg = unit.buffer.splice(0,1)[0]
      doSend(unit, msg, 3, error => {
        if (error) {
          logger.error(`flushing buffer for ${unit.id}: ${JSON.stringify(error)}`)
          if (callback)
            callback()
        } else {
          flush(unit, callback)
        }
      })
    } else {
      doSend(unit, {cmd: 'eof'}, error => {
        if (error)
          logger.error(`sending EOF for ${unit.id}: ${JSON.stringify(error)}`)
        if (callback)
          callback()
      })
    }
  }
}

function connect(id, socket) {
  // register this guy if he hasn't been registered yet
  let unit = getUnit(id, socket)

  socket.onClose(() => disconnect(id))

  // send available messages
  flush(unit)
}

function disconnect(id) {
  if (units[id]) {
    let unit = {
      buffer: units[id].buffer,
      socket: units[id].socket
    }
    delete units[id].socket
  } else {
    // programmer error
    logger.error(`tried to disconnect missing unit: ${id}`)
  }
}

module.exports = {
  connect: connect,
  disconnect: disconnect,
  sendMessage: sendMessage
}
