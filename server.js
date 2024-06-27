const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const { ExpressPeerServer } = require('peer');

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(express.json());
app.use(express.static('public'));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).send('User registered');
    } catch (error) {
        res.status(400).send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).send('User not found');
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).send('Invalid password');
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        });
    });
});

// PeerJS setup
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs'
});
app.use('/peerjs', peerServer);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
