(function() {

window.World = {
  scene: null, camera: null, renderer: null, clock: null,
  state: {
    started: false, fragments: 0, totalFragments: 3,
    currentZone: -1, zonesDone: [false, false, false],
    finaleShown: false, dialogueActive: false,
    collected: [], obstacles: [], particles: []
  },
  playerPos: new THREE.Vector3(0, 0, -25),
  playerRot: 0,
  keys: { fwd: false, back: false, left: false, right: false, sprint: false, jump: false },
  mouseDown: false, mouseDX: 0, mouseDY: 0
};

var W = window.World;

window.initGame = function() {
  var container = document.getElementById('game-container');

  W.scene = new THREE.Scene();
  W.scene.fog = new THREE.Fog(0x1a1040, 30, 70);

  W.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
  W.camera.position.set(5, 3, 8);

  W.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  W.renderer.setSize(window.innerWidth, window.innerHeight);
  W.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  W.renderer.shadowMap.enabled = true;
  W.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  W.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  W.renderer.toneMappingExposure = 1.2;
  container.appendChild(W.renderer.domElement);
  W.clock = new THREE.Clock();

  window.addEventListener('resize', function() {
    W.camera.aspect = window.innerWidth / window.innerHeight;
    W.camera.updateProjectionMatrix();
    W.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  initLighting();
  if (typeof buildTerrain === 'function') buildTerrain();
  if (typeof buildZones === 'function') buildZones();
  if (typeof buildCompanion === 'function') buildCompanion();
  setupInput();
  animate();
};

function initLighting() {
  var hemi = new THREE.HemisphereLight(0xffeedd, 0x443366, 0.6);
  W.scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xffcc88, 1.2);
  sun.position.set(30, 40, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  W.scene.add(sun);

  var fill = new THREE.DirectionalLight(0x8888ff, 0.3);
  fill.position.set(-20, 20, 30);
  W.scene.add(fill);

  var amb = new THREE.AmbientLight(0x334466, 0.25);
  W.scene.add(amb);

  W._sun = sun;
}

function setupInput() {
  document.addEventListener('keydown', function(e) {
    switch(e.key) {
      case 'w': case 'W': case 'ArrowUp': W.keys.fwd = true; break;
      case 's': case 'S': case 'ArrowDown': W.keys.back = true; break;
      case 'a': case 'A': case 'ArrowLeft': W.keys.left = true; break;
      case 'd': case 'D': case 'ArrowRight': W.keys.right = true; break;
      case 'Shift': W.keys.sprint = true; break;
      case ' ': W.keys.jump = true; e.preventDefault(); break;
      case 'e': case 'E': handleInteract(); break;
    }
  });

  document.addEventListener('keyup', function(e) {
    switch(e.key) {
      case 'w': case 'W': case 'ArrowUp': W.keys.fwd = false; break;
      case 's': case 'S': case 'ArrowDown': W.keys.back = false; break;
      case 'a': case 'A': case 'ArrowLeft': W.keys.left = false; break;
      case 'd': case 'D': case 'ArrowRight': W.keys.right = false; break;
      case 'Shift': W.keys.sprint = false; break;
      case ' ': W.keys.jump = false; break;
    }
  });

  document.addEventListener('mousemove', function(e) {
    W.mouseDX += e.movementX;
    W.mouseDY += e.movementY;
  });

  document.addEventListener('mousedown', function(e) {
    if (e.button === 0) W.mouseDown = true;
  });

  document.addEventListener('mouseup', function(e) {
    if (e.button === 0) W.mouseDown = false;
  });
}

function handleInteract() {
  if (W.state.dialogueActive) {
    if (typeof advanceDialogue === 'function') advanceDialogue();
    return;
  }
  if (typeof checkZoneCollect === 'function') checkZoneCollect();
}

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(W.clock.getDelta(), 0.05);

  if (W.state.started) {
    if (typeof updatePlayer === 'function') updatePlayer(dt);
    if (typeof updateCompanion === 'function') updateCompanion(dt);
    if (typeof updateZones === 'function') updateZones(dt);
    updateParticles(dt);
    updateHUD();
  }

  W.renderer.render(W.scene, W.camera);
}

function updateParticles(dt) {
  for (var i = W.state.particles.length - 1; i >= 0; i--) {
    var p = W.state.particles[i];
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.life -= dt;
    if (p.mesh.material.opacity !== undefined) {
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    }
    if (p.life <= 0) {
      W.scene.remove(p.mesh);
      W.state.particles.splice(i, 1);
    }
  }
}

window.spawnParticles = function(pos, count, color, speed) {
  color = color || 0xffaa44;
  speed = speed || 2;
  for (var i = 0; i < (count || 10); i++) {
    var size = 0.04 + Math.random() * 0.06;
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 })
    );
    mesh.position.copy(pos);
    W.scene.add(mesh);
    W.state.particles.push({
      mesh: mesh,
      vx: (Math.random() - 0.5) * speed,
      vy: Math.random() * speed * 1.5,
      vz: (Math.random() - 0.5) * speed,
      life: 0.8 + Math.random() * 0.6,
      maxLife: 1.4
    });
  }
};

window.showNotification = function(text, color) {
  var el = document.getElementById('notif');
  el.textContent = text;
  el.style.borderColor = color || '#ffaa44';
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove('show'); }, 2500);
};

window.updateHUD = function() {
  document.getElementById('fragmentCount').textContent = '\u2726 ' + W.state.fragments + ' / ' + W.state.totalFragments;

  var dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), W.playerRot);
  var angle = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
  var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var idx = Math.round(((angle + 360) % 360) / 45) % 8;
  document.getElementById('compass').textContent = dirs[idx] + ' \u2191';
};

window.completeGame = function() {
  W.state.finaleShown = true;
  document.getElementById('finaleOverlay').classList.add('show');
  playFinaleMusic();
  launchConfetti();
};

function playFinaleMusic() {
  [392, 440, 523, 587, 659, 784, 880, 1047].forEach(function(n, i) {
    setTimeout(function() {
      if (typeof window.playNote === 'function') window.playNote(n, 0.3);
    }, i * 200);
  });
}

function launchConfetti() {
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9;pointer-events:none';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var pieces = [];
  var colors = ['#ffaa44', '#ff6b7d', '#44ff88', '#88ddff', '#c9a6e0', '#ffffff'];
  for (var i = 0; i < 150; i++) {
    pieces.push({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 300,
      w: 4 + Math.random() * 6, h: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * 360
    });
  }
  var frame = 0;
  function draw() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = false;
    for (var p = 0; p < pieces.length; p++) {
      var pi = pieces[p];
      pi.y += pi.vy;
      pi.x += pi.vx;
      pi.rot += pi.vy * 2;
      if (pi.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(pi.x, pi.y);
      ctx.rotate(pi.rot * Math.PI / 180);
      ctx.fillStyle = pi.color;
      ctx.fillRect(-pi.w / 2, -pi.h / 2, pi.w, pi.h);
      ctx.restore();
    }
    if (alive && frame < 500) requestAnimationFrame(draw);
    else document.body.removeChild(canvas);
  }
  draw();
}

var ld = document.getElementById('loading');
if (ld) ld.style.display = 'none';

})();
