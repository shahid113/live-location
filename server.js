const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentLocation = null;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Homepage to view the live location
app.get('/', (req, res) => {
  res.render('dashboard', { location: currentLocation });
});

// Location sharing page
app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/location.html'));
});

// Handle live location from client
io.on('connection', (socket) => {
  socket.on('send-location', (data) => {
    currentLocation = data;
    io.emit('update-location', currentLocation);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
