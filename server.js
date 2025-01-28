const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve static files from the 'public' directory

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data); // Send the drawing data to all other users
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
