(function() {
  var idx = 2;
  var state = { lasers: [], duration: 15, timer: 0, completed: false, entered: false, hits: 0, maxHits: 3, spawnTimer: 0 };

  window.roomGames[2] = {
    build: function(r, idx, cfg) {
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z - 3.5, new THREE.MeshStandardMaterial({color:0x0d0d0d, emissive:0x1a0000, emissiveIntensity:0.1}));
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z + 3.5, new THREE.MeshStandardMaterial({color:0x0d0d0d, emissive:0x1a0000, emissiveIntensity:0.1}));
      window.addWallBox(7, 3, 0.2, r.x - 3.5, 1.5, r.z, new THREE.MeshStandardMaterial({color:0x0d0d0d, emissive:0x1a0000, emissiveIntensity:0.1}));
      
      var scene = window.getScene();
      var ceil = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0d0d0d, emissive:0x1a0000, emissiveIntensity:0.05}));
      ceil.position.set(r.x, 3, r.z); scene.add(ceil);
      
      var floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0a0a0a, roughness:0.9}));
      floor.position.set(r.x, 0, r.z); floor.receiveShadow = true; scene.add(floor);
      
      var stripMat = new THREE.MeshStandardMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:0.3});
      for (var i = -3; i <= 3; i+=2) {
        var s1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.02, 0.03), stripMat);
        s1.position.set(r.x + i, 0.06, r.z); scene.add(s1);
        var s2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 6.8), stripMat);
        s2.position.set(r.x, 0.06, r.z + i); scene.add(s2);
      }
      
      var warnMat = new THREE.MeshStandardMaterial({color:0xff4400, emissive:0xff4400, emissiveIntensity:0.2});
      for (var w = -2; w <= 2; w += 2) {
        var warn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.8), warnMat);
        warn.position.set(r.x - 3.45, 2.2, r.z + w); scene.add(warn);
        warn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.05), warnMat);
        warn.position.set(r.x + w, 2.2, r.z + 3.45); scene.add(warn);
      }
      
      state.duration = (cfg && cfg.duration) ? cfg.duration : 15;
      state.lasers = [];
      state.hits = 0;
      state.maxHits = 3;
    },
    
    enter: function(idx, cfg) {
      state.timer = state.duration;
      state.completed = false;
      state.entered = true;
      state.lasers = [];
      state.hits = 0;
      state.spawnTimer = 0;
    },
    
    update: function(dt) {
      if (state.completed || !state.entered) return;
      state.timer -= dt;
      if (state.timer <= 0) {
        state.completed = true;
        window.completeRoomGame(2);
        return;
      }
      
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = 0.5 + Math.random() * 1.0;
        this._spawnLaser();
      }
      
      var scene = window.getScene();
      for (var i = state.lasers.length - 1; i >= 0; i--) {
        var l = state.lasers[i];
        l.life -= dt;
        if (l.life <= 0) {
          scene.remove(l.mesh);
          if (l.glow) scene.remove(l.glow);
          state.lasers.splice(i, 1);
          continue;
        }
        
        l.pos.x += l.vel.x * dt;
        l.pos.z += l.vel.z * dt;
        
        var r = window.ROOMS[2];
        if (l.pos.x < r.x - 3.2 || l.pos.x > r.x + 3.2) { l.vel.x *= -1; }
        if (l.pos.z < r.z - 3.2 || l.pos.z > r.z + 3.2) { l.vel.z *= -1; }
        
        l.pos.x = Math.max(r.x - 3.2, Math.min(r.x + 3.2, l.pos.x));
        l.pos.z = Math.max(r.z - 3.2, Math.min(r.z + 3.2, l.pos.z));
        
        l.mesh.position.copy(l.pos);
        if (l.glow) l.glow.position.copy(l.pos);
        
        l.mesh.rotation.x += dt * 3;
        l.mesh.rotation.y += dt * 2;
        
        var player = window.player;
        var dist = Math.hypot(player.x - l.pos.x, player.z - l.pos.z);
        if (dist < 0.6 && l.hitCooldown <= 0) {
          l.hitCooldown = 1.0;
          state.hits++;
          window.showNotification('\u26A1 Hit! ' + state.hits + '/' + state.maxHits, '#ff4400');
          window.playNote(200, 0.15, 'sawtooth');
          window.S.shakeOffset = { x: (Math.random()-0.5)*0.3, y: (Math.random()-0.5)*0.2 };
          window.S.shakeTimer = 0.15;
          if (state.hits >= state.maxHits) {
            window.gameOver();
          }
        }
        if (l.hitCooldown > 0) l.hitCooldown -= dt;
        
        if (l.glow) l.glow.intensity = 0.5 + Math.sin(performance.now() * 0.01) * 0.3;
      }
    },
    
    _spawnLaser: function() {
      var scene = window.getScene();
      var r = window.ROOMS[2];
      
      var geo = Math.random() > 0.5 ? new THREE.OctahedronGeometry(0.2) : new THREE.TetrahedronGeometry(0.25);
      var mat = new THREE.MeshStandardMaterial({
        color: 0xff2200, emissive: 0xff4400, emissiveIntensity: 0.8,
        transparent: true, opacity: 0.9
      });
      var mesh = new THREE.Mesh(geo, mat);
      
      var edge = Math.floor(Math.random() * 4);
      var x, z;
      switch(edge) {
        case 0: x = r.x - 2.5; z = r.z + (Math.random() - 0.5) * 5; break;
        case 1: x = r.x + 2.5; z = r.z + (Math.random() - 0.5) * 5; break;
        case 2: x = r.x + (Math.random() - 0.5) * 5; z = r.z - 2.5; break;
        case 3: x = r.x + (Math.random() - 0.5) * 5; z = r.z + 2.5; break;
      }
      
      var y = 0.5 + Math.random() * 1.5;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      scene.add(mesh);
      
      var glow = new THREE.PointLight(0xff2200, 0.6, 3);
      glow.position.set(x, y, z);
      scene.add(glow);
      
      state.lasers.push({
        mesh: mesh, glow: glow, pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3((Math.random()-0.5)*4, 0, (Math.random()-0.5)*4),
        life: 3 + Math.random() * 3, hitCooldown: 0
      });
    },
    
    click: function() { return false; },
    interact: function() { return false; },
    
    hud: function(timer, prog, cfg) {
      var secs = Math.max(0, Math.ceil(state.timer));
      var m = Math.floor(secs / 60), s = secs % 60;
      timer.textContent = '\u23F1 ' + m + ':' + (s < 10 ? '0' : '') + s;
      prog.innerHTML = '';
      for (var i = 0; i < state.maxHits; i++) {
        var dot = document.createElement('div'); dot.className = 'dot' + (i < state.hits ? ' done' : '');
        prog.appendChild(dot);
      }
    }
  };
})();
