#!/usr/bin/env node --harmony
"use strict";
const net = require('net')
const B = require('baconjs')
const R = require('ramda')
const io = require('socket.io-client')
const houmSocket = io('http://houmi.herokuapp.com')
const houmConnectE = B.fromEvent(houmSocket, "connect").map("HOUM").log("Connected to")
const houmDisconnectE = B.fromEvent(houmSocket, "disconnect")
const houmConfig = require('./houm-config.js')
houmConnectE.onValue( () =>
  houmSocket.emit('clientReady', { siteKey: houmConfig.siteKey}))

var lightStateP = B.fromEvent(houmSocket, 'setLightState')
  .scan({}, (state, lightState) => {
    const newState = R.clone(state)
    const id = houmConfig.lights[lightState._id]
    if (id) {
      newState[id] = lightState.bri
    } else {
      console.log("unknown light", lightState._id, "brightness", lightState.bri)
    }
    return newState
  }).log("lightstate")

var addSocketE = B.Bus()
addSocketE.map(".id").log("Light connected")
var removeSocketE = B.Bus()
removeSocketE.map(".id").log("Light disconnected")

var lightsP = B.update({},
  removeSocketE, (lights, entry) => R.dissoc(entry.id, lights),
  addSocketE, (lights, entry) => R.assoc(entry.id, entry.socket, lights)
)

B.onValues(lightStateP, lightsP, (lightState, lights) => {
  let ids = R.keys(lightState).filter(id => R.contains(id, R.keys(lights)))
  ids.forEach(id => {
    let socket = lights[id]
    let brightness = lightState[id]
    sendBrightness(socket, brightness)
  })
})

net.createServer(socket => {
  var id
  console.log('connected')
  sendBrightness(socket, 100)
  toCommandStream(socket).onValue(cmd => {
    let command = cmd.command
    let data = cmd.data
    if (command == 'p') {
      console.log("Got ping")
      sendPing(socket)
    } else if (command == 'i') {
      id = data
      console.log("Got id", id)
      addSocketE.push({socket, id})
    } else {
      console.log('received', command, data)
    }
  })

  B.fromEvent(socket, 'error').log("error")
  removeSocketE.plug(B.fromEvent(socket, 'close').take(1).map(() => { socket, id }))
}).listen(8000)

function toCommandStream(stream) {
  return toBytePairStream(stream).map( arr => 
    ({ command: String.fromCharCode(arr[0]), data: arr[1] })
  )
}

function toBytePairStream(stream) {
  return toByteStream(stream).bufferWithCount(2)
}

function toByteStream(stream) {
  return B.fromEvent(stream, 'data').flatMap(buffer =>
    B.fromArray(Array.prototype.slice.call(buffer, 0)))
}

function sendBrightness(socket, b) {
  console.log("Sending brightness", b)
  socket.write("b", "ascii")
  socket.write(new Buffer([b]))
}

function randomBrightness() {
  return Math.floor(Math.random()*100)
}

function sendPing(socket) {
  socket.write("p", "ascii")
}
