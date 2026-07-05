(function() {

window.CONTROLS = {
  keys: { fwd:false, back:false, left:false, right:false, sprint:false, jump:false, crouch:false },
  pointerLocked: false,
  player: { x:3, y:1.6, z:0, vy:0 },
  yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0,
  pitchLimit: Math.PI / 2.3,
  shootOnClick: false,
  _lockClick: false,

  init: function() {
    var self = this;

    document.addEventListener('pointerlockchange', function() {
      self.pointerLocked = document.pointerLockElement !== null;
      var hint = document.getElementById('pointerLockHint');
      if (hint) hint.style.display = (!self.pointerLocked && window.S && window.S.entered) ? 'flex' : 'none';
      var ch = document.getElementById('crosshair');
      if (ch) ch.style.opacity = self.pointerLocked ? '1' : '0';
      self._lockClick = false;
    });

    document.addEventListener('click', function(e) {
      if (!self.pointerLocked && window.S && window.S.entered && !window.S.gameOver) {
        self._lockClick = true;
        document.body.requestPointerLock();
        setTimeout(function() { self._lockClick = false; }, 100);
      }
    });

    document.addEventListener('mousemove', function(e) {
      if (!self.pointerLocked) return;
      var sens = (window.CFG && window.CFG.mouseSens) ? window.CFG.mouseSens : 0.0018;
      self.targetYaw -= e.movementX * sens;
      self.targetPitch -= e.movementY * sens;
      self.targetPitch = Math.max(-self.pitchLimit, Math.min(self.pitchLimit, self.targetPitch));
    });

    document.addEventListener('keydown', function(e) {
      switch(e.key) {
        case 'w': case 'W': case 'ArrowUp': self.keys.fwd = true; break;
        case 's': case 'S': case 'ArrowDown': self.keys.back = true; break;
        case 'a': case 'A': case 'ArrowLeft': self.keys.left = true; break;
        case 'd': case 'D': case 'ArrowRight': self.keys.right = true; break;
        case 'Shift': self.keys.sprint = true; break;
        case ' ': self.keys.jump = true; e.preventDefault(); break;
        case 'Control': self.keys.crouch = true; e.preventDefault(); break;
      }
    });

    document.addEventListener('keyup', function(e) {
      switch(e.key) {
        case 'w': case 'W': case 'ArrowUp': self.keys.fwd = false; break;
        case 's': case 'S': case 'ArrowDown': self.keys.back = false; break;
        case 'a': case 'A': case 'ArrowLeft': self.keys.left = false; break;
        case 'd': case 'D': case 'ArrowRight': self.keys.right = false; break;
        case 'Shift': self.keys.sprint = false; break;
        case ' ': self.keys.jump = false; break;
        case 'Control': self.keys.crouch = false; break;
      }
    });

    document.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      if (self._lockClick) return;
      if (self.pointerLocked && window.shoot) window.shoot();
    });
  },

  update: function(dt) {
    if (!window.S || !window.S.entered || window.S.gameOver || !this.pointerLocked) return;

    var speed = window.CFG ? (this.keys.sprint ? window.CFG.moveSpeed * 1.6 : window.CFG.moveSpeed) : 4;
    var fwd = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
    var right = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
    var dx = 0, dz = 0;
    if (this.keys.fwd) { dx += fwd.x * speed * dt; dz += fwd.z * speed * dt; }
    if (this.keys.back) { dx -= fwd.x * speed * dt; dz -= fwd.z * speed * dt; }
    if (this.keys.left) { dx -= right.x * speed * dt; dz -= right.z * speed * dt; }
    if (this.keys.right) { dx += right.x * speed * dt; dz += right.z * speed * dt; }
    if (dx !== 0 && dz !== 0) { dx *= 0.707; dz *= 0.707; }

    var h = window.CFG ? window.CFG.height : 1.6;
    var cfgRadius = window.CFG ? window.CFG.radius : 0.3;

    // Crouch
    var eyeHeight = this.keys.crouch ? h * 0.6 : h;

    // Horizontal collision
    var wallBoxes = window.getWallBoxes ? window.getWallBoxes() : [];
    var nx = this.player.x + dx, nz = this.player.z + dz;
    var box = new THREE.Box3(
      new THREE.Vector3(nx - cfgRadius, 0, nz - cfgRadius),
      new THREE.Vector3(nx + cfgRadius, 2, nz + cfgRadius)
    );
    var blocked = false;
    for (var i = 0; i < wallBoxes.length; i++) {
      if (box.intersectsBox(wallBoxes[i])) { blocked = true; break; }
    }
    if (!blocked) { this.player.x = nx; this.player.z = nz; }

    // Jump physics
    var gravity = window.CFG ? (window.CFG.gravity || 14) : 14;
    var jumpSpeed = window.CFG ? (window.CFG.jumpSpeed || 6) : 6;

    if (this.keys.jump && this.player.y <= eyeHeight + 0.01) {
      this.player.vy = jumpSpeed;
    }

    this.player.vy -= gravity * dt;
    this.player.y += this.player.vy * dt;

    // Ground collision
    if (this.player.y <= eyeHeight) {
      this.player.y = eyeHeight;
      this.player.vy = 0;
    }

    // Ceiling collision (room ceiling at y=3)
    if (this.player.y >= 2.8) {
      this.player.y = 2.8;
      this.player.vy = 0;
    }

    // Update camera position
    window.player.x = this.player.x;
    window.player.z = this.player.z;
    window.player.y = this.player.y;

    // Smooth camera rotation — frame-rate-independent lerp
    var smooth = (window.CFG && window.CFG.mouseSmooth) ? window.CFG.mouseSmooth : 9;
    var smoothFactor = 1 - Math.exp(-smooth * dt);
    this.yaw += (this.targetYaw - this.yaw) * smoothFactor;
    this.pitch += (this.targetPitch - this.pitch) * smoothFactor;
  }
};

})();
