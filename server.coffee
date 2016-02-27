#!/usr/bin/env node --harmony
'use strict';
port = 8000
net = require 'net'
B = require 'baconjs'
R = require 'ramda'
io = require 'socket.io-client'
log = (msg...) -> console.log new Date(), msg...
houmSocket = io 'http://houmi.herokuapp.com'
houmConnectE = B.fromEvent(houmSocket, 'connect')
houmDisconnectE = B.fromEvent(houmSocket, 'disconnect')
houmConfig = require('./houm-config.js')
houmConnectE.forEach => 
  houmSocket.emit('clientReady', { siteKey: houmConfig.siteKey})
  log 'Connected to HOUM'
lightStateP = B.fromEvent(houmSocket, 'setLightState')
  .scan({}, ((state, lightState) =>
    newState = R.clone(state)
    id = houmConfig.lights[lightState._id]
    if (id)
      newState[id] = lightState.bri
    else
      log('unknown light', lightState._id, 'brightness', lightState.bri)
    newState
  )).log('lightstate')

addSocketE = B.Bus()
addSocketE.map('.id').forEach log, 'Light connected'
removeSocketE = B.Bus()
removeSocketE.map('.id').forEach log, 'Light disconnected'

lightsP = B.update({},
  removeSocketE, (lights, entry) => R.dissoc(entry.id, lights),
  addSocketE, (lights, entry) => R.assoc(entry.id, entry.socket, lights)
)

B.onValues(lightStateP, lightsP, (lightState, lights) =>
  ids = R.keys(lightState).filter((id) => R.contains(id, R.keys(lights)))
  ids.forEach((id) =>
    socket = lights[id]
    brightness = lightState[id]
    sendBrightness(socket, brightness)
  )
)

net.createServer((socket) =>
  id = null
  log 'connected', socket.remoteAddress
  toCommandStream(socket).onValue((cmd) =>
    command = cmd.command
    data = cmd.data
    if (command == 'p')
      log('Got ping')
      sendPing(socket)
    else if (command == 'i')
      id = data
      log('Got id', id)
      addSocketE.push({socket, id})
      removeSocketE.plug(discoE)
    else
      log('received', command, data)
  )

  B.fromEvent(socket, 'error').log('error')
  discoE = B.fromEvent(socket, 'close').take(1).map(() => ({ socket, id }))
  discoE.forEach => log 'disconnected', socket.remoteAddress
).listen(port)

log 'listening on', port

toCommandStream = (stream) =>
  toBytePairStream(stream).map((arr) => 
    ({ command: String.fromCharCode(arr[0]), data: arr[1] })
  )

toBytePairStream = (stream) =>
  toByteStream(stream).bufferWithCount(2)

toByteStream = (stream) =>
  B.fromEvent(stream, 'data').flatMap((buffer) =>
    B.fromArray(Array.prototype.slice.call(buffer, 0)))

sendBrightness = (socket, b) =>
  log('Sending brightness', b)
  socket.write('b', 'ascii')
  socket.write(new Buffer([b]))

randomBrightness = =>
  Math.floor(Math.random()*100)

sendPing =  (socket) =>
  socket.write('p', 'ascii')
