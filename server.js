#!/usr/bin/env node --harmony
"use strict";
const net = require('net')
const B = require('baconjs')
const R = require('ramda')
const io = require('socket.io-client')
const houmSocket = io('http://houmi.herokuapp.com')
const houmConnectE = B.fromEvent(houmSocket, "connect").map("HOUM").log("Connected to")
const houmDisconnectE = B.fromEvent(houmSocket, "disconnect")
houmConnectE.onValue( () =>
  houmSocket.emit('clientReady', require('./houm-config.js')))

B.fromEvent(houmSocket, 'setLightState')
  .scan({}, (state, lightState) => {
    const newState = R.clone(state)
    newState[lightState._id] = lightState.bri
    return newState
  }).log("lightstate")

net.createServer(socket => {
  console.log('connected')
  sendBrightness(socket, 100)
  toCommandStream(socket).onValue(cmd => {
    let command = cmd.command
    let data = cmd.data
    if (command == 'p') {
      console.log("Got ping")
      sendBrightness(socket, randomBrightness());
    } else if (command == 'i') {
      console.log("Got id", data)
    } else {
      console.log('received', command, data)
    }
  })

  B.fromEvent(socket, 'data').onValue(data => {
  })
  B.fromEvent(socket, 'error').log("error")
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
