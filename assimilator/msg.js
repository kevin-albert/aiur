// create a bidirectional communication stream
var registry = {}

module.exports = {
  create: function(typer, executor) {
    if (!registry[typer.id]) {
      registry[typer.id] = {}
    } else if (registry[typer.id][executor.id]) {
      return registry[typer.id][executor.id]
    } else {
      return registry[typer.id][executor.id] = {
        i: function(data) {
          executorSocket.write(data)
        },
        o: function(data) {
          typerSocket.write(data)
        }
      }
    }
  },
  close: function(typer, executor) {
    if (registry[typer.id]) {
      delete registry[typer.id][executor.id]
      if (registry[typer.id] == {}) {
        delete registry[typer.id]
      }
    }
  },
  closeAll: function(typer) {
    delete registry[typer.id]
  }
}
