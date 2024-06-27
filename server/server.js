const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('join', (language) => {
        if (!rooms[language]) rooms[language] = [];
        if (rooms[language].length > 0 && rooms[language][rooms[language].length - 1].length < 2) {
            rooms[language][rooms[language].length - 1].push(socket.id);
        } else {
            rooms[language].push([socket.id]);
        }

        const room = rooms[language][rooms[language].length - 1];
        socket.join(room);
        if (room.length === 2) {
            io.to(room[0]).emit('ready');
            io.to(room[1]).emit('ready');
            io.to(room).emit('connected');
        }
    });

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('leave', () => {
        for (let language in rooms) {
            for (let i = 0; i < rooms[language].length; i++) {
                const room = rooms[language][i];
                if (room.includes(socket.id)) {
                    room.splice(room.indexOf(socket.id), 1);
                    if (room.length === 0) rooms[language].splice(i, 1);
                    socket.leave(room);
                    break;
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
