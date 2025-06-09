const socket = io();

function sendLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const data = {
          lat: position.coords.latitude.toFixed(8),
          lng: position.coords.longitude.toFixed(8),
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          time: new Date().toISOString(),
        };
        socket.emit('send-location', data);
      },
      (error) => {
        alert('Location permission denied or error: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}
