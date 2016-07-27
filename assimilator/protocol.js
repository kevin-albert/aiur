'use strict'

const net = require('net')
const obfuscator = require('../obfuscator')
const router = require('./router')
const logger = require('./logger')('protocol')

function createServer(port, handler) {
  net.createServer(socket => {
    const o = obfuscator.create()
    let callback = (message) => logger.debug('received message with no callback handler')
    function onMessage(callback) {
      socket.on('data', data => {
        o.d(data, message => {
          callback(message)
        })
      }).on('error', error => logger.error(JSON.stringify(error)))
    }

    function send(message, callback) {
      o.e(message, data => {
        socket.write(data, callback)
      })
    }

    function close(callback) {
      socket.end(callback)
    }

    function onClose(callback) {
      socket.on('end', callback)
    }

    function onError(callback) {
      socket.on('error', callback)
    }

    // create a proxy socket
    let proxy = {
      onMessage: onMessage,
      send: send,
      close: close,
      onClose: onClose,
      onError: onError
    }

    handler(proxy)
  }).listen({port: port}, () => logger.info(`listening on ${port}`))
}

module.exports = {
  createServer: createServer
}
