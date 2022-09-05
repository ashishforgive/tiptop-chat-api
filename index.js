const http = require('http')
const express = require('express')
const cors = require('cors')
const socketIO = require('socket.io')
const app = express()
// const port = 3000

app.use(cors())
const server = http.createServer(app)
//const io = require('socket.io')(server, {path: '/octagon/socket.io'});
// const io = socketIO(server)
const io = socketIO((server, {path: '/chat/socket.io'}))
const users = []

io.on('connection', (socket) => {
	console.log("connection", socket);
  for (let [id, sct] of io.of('/').sockets) {
    const uid = sct?.handshake?.auth?.id
    const index = users.findIndex((itm) => itm.id === uid)
    if (index === -1 && sct?.handshake?.auth?.id)
      users.push({
        id: sct?.handshake?.auth?.id,
        name: sct?.handshake?.auth?.name,
        avatar: sct?.handshake?.auth?.avatar,
        sid: id,
        messages: [],
        active: sct?.handshake?.auth?.active,
        hasNewMessages: 0,
      })
  }
  io.emit('users', users)
  socket.on('joined', (user) => {
    const activeIndx = users.findIndex((itm) => itm.id === user?.id)
    if (activeIndx !== -1) {
      users[activeIndx].active = true
      users[activeIndx].sid = socket.id
    }
    users.sort((a, b) => a?.name?.localeCompare(b?.name))
    io.emit('users', users)
  })
  socket.on('onChat', () => {
    users.sort((a, b) => a?.name?.localeCompare(b?.name))
    io.emit('users', users)
  })

  socket.on('private message', ({ content, to, id, time, toUser, fullTime }) => {
    socket.to(to).emit('sendMessage', {
      content,
      from: id,
      time,
      to: toUser,
      fullTime,
    })
  })
  socket.on('disconnect', () => {
    const activeIndx = users.findIndex((itm) => itm.sid === socket.id)
    if (activeIndx !== -1) users[activeIndx].active = false
    io.emit('users', users)
  })
})

app.get('/', (req, res) => {
    res
      .status(200)
      .send('Server is running for chat Api')
      .end();
  });
// server.listen(port)
server.listen(process.env.PORT || 3000, () => {
  console.log("Index11 listening at", process.env.PORT || 3000);
});
