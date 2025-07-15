// Simple boot screen
setTimeout(() => {
  document.getElementById("bsod").style.display = "none";
  document.getElementById("boot-screen").style.display = "none";
}, 0);

// Drag logic
const windowIds = ["windowIntro", "windowIntro2", "window3", 'cmd']; // Replace with your actual window IDs

windowIds.forEach(id => {
  const win = document.getElementById(id);
  if (!win) return;

  const header = win.querySelector(".title-bar");
  let offsetX, offsetY, isDragging = false;

  if (header) {
    header.addEventListener("mousedown", e => {
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;

      // Dynamically set zIndex to bring the window to the front
      const maxZIndex = windowIds.reduce((max, id) => {
        const el = document.getElementById(id);
        return el ? Math.max(max, parseInt(window.getComputedStyle(el).zIndex) || 0) : max;
      }, 0);
      win.style.zIndex = maxZIndex + 1;

      // Add event listeners dynamically
      const onMouseMove = e => {
        if (isDragging) {
          win.style.left = (e.clientX - offsetX) + "px";
          win.style.top = (e.clientY - offsetY) + "px";
        }
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // Close button
  const closeBtn = win.querySelector(".btn-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      win.style.display = "none";
    });
  }
});


const audioPlayer = new Audio("img/msc.mp3");
let duration = 0;

audioPlayer.addEventListener("loadedmetadata", () => {
  duration = audioPlayer.duration; 
  document.getElementById("range24").
  audioPlayer.play();
});

audioPlayer.addEventListener("timeupdate", () => {
  const currentTime = audioPlayer.currentTime;
  const progress = (currentTime / duration) * 100;
  document.getElementById("duration-label").textContent = `${duration.toFixed(6)/60}`;
  document.getElementById("range23").value = progress;
});

document.getElementById("range23").addEventListener("input", (e) => {
  const value = e.target.value;
  audioPlayer.currentTime = (value);
});

audioPlayer.addEventListener("ended", () => {
  console.log("Audio playback finished.");
});

// Optional: Pause and resume controls
document.getElementById("pause-btn").addEventListener("click", () => {
  audioPlayer.pause();
});

document.getElementById("play-btn").addEventListener("click", () => {
  audioPlayer.play();
});
      const easterEggs = [
  "💕 You are valid, cutie 💕",
  "🌈 Trans rights are human rights 🌈",
  "✨ Executing slay.sh... done.",
];
//cmd setup
const cmdInput = document.getElementById("commandInput");
document.getElementById("commandInput").addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const command = cmdInput.value;
    const output = document.getElementById("cmdwind");

    if (command === "cls") {
      output.innerHTML = "";
      return;
    }
    if (command === "help") {
      output.innerHTML += `<p style="color: azure; margin: 1px;">Available commands: cls, help</p>`;
      command == 'Available commands: cls, help';
    }
    if (command === "exit") {
      document.getElementById("cmd").style.display = "none";
      return;
    }
    if (command === "owo") {
      output.innerHTML += `<p style="color: azure; margin: 1px;">OwO what\'s this? UwU</p>`;  
      command == 'OwO what\'s this? UwU';
    }
    if (command === "neofetch") {
      output.innerHTML += `<div style="font-family: monospace; line-height: 1.2;">
      <span style="color: #00ff99; font-weight: bold;">lucy@bimbows</span>
      <span style="color: white;">-----------------</span>
      <div><span style="color: #00ff99; font-weight: bold;">OS:</span> <span style="color: azure;">Bimbows 69</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Host:</span> <span style="color: azure;">Personal-PC</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Kernel:</span> <span style="color: azure;">420.69.1337.0.1</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Uptime:</span> <span style="color: azure;">1 day, 2 hours</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Packages:</span> <span style="color: azure;">1337 (uwu)</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Shell:</span> <span style="color: azure;">bimsh 5.0</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Resolution:</span> <span style="color: azure;">1920x1080</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">DE:</span> <span style="color: azure;">BimDE</span></div>
      <div><span style="color: #00ff99; font-weight: bold;">Memory:</span> <span style="color: azure;">4.2GB / 69GB</span></div>
      <div style="color: #ffccff; font-family: monospace;">${easterEggs[Math.floor(Math.random() * easterEggs.length)]}</div>
      </div>`;
    }


    cmdInput.value = "";
    output.innerHTML += `<p style="color: azure; margin: 1px;">C:\\Users\\Lucy\\Desktop> <input type="text" class="commandInput" style="background-color: transparent; color: azure; border: none; outline: none; flex-grow: 1;box-shadow:none; font-family: inherit; font-size: inherit; padding: 0;"></p>`;

    const newInput = output.querySelector(".commandInput:last-of-type");
    newInput.focus();
    newInput.addEventListener('keydown', arguments.callee);
  }
});

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPosition = 0;

document.addEventListener('keydown', function (event) {
  if (document.activeElement === document.getElementById("commandInput")) {
    return;
  }
  
  const key = event.key;
  const requiredKey = konamiCode[konamiPosition];
  
  if (key.toLowerCase() === requiredKey.toLowerCase()) {
    konamiPosition++;
    
    if (konamiPosition === konamiCode.length) {
      document.getElementById("bsod").style.display = 'block';
    }
  } else {
    konamiPosition = 0; // Reset if wrong key pressed
  }
});

function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById("time").textContent = `${hours}:${minutes}`;
}
setInterval(updateTime, 100);