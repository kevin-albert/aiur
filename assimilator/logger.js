'use strict'

function create(name) {
  function log(type, message) {
    console.log(`${type} - ${name}: ${message}`)
  }

  return {
    info:  (message) => log('info', message),
    error: (message) => log('error', message),
    debug: (message) => log('debug', message)
  }
}

module.exports = create
