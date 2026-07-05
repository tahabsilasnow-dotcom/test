(function() {
  var idx = 0;
  var state = { targets: [], completed: false, entered: false };
  var room = null;

  window.roomGames[0] = {
    build: function(r, idx, cfg) {
      room = r;
      var scene = window.getScene();
      
      // Create 3 walls (skip front wall for doorway)
      // Room is 7x7 centered at (r.x, 0, r.z)
      // Left wall (z = r.z - 3.5)
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z - 3.5, new THREE.MeshStandardMaterial({color:0x1a0a2e, emissive:0x0d0520, emissiveIntensity:0.3}));
      // Right wall (z = r.z + 3.5)
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z + 3.5, new THREE.MeshStandardMaterial({color:0x1a0a2e, emissive:0x0d0520, emissiveIntensity:0.3}));
      // Back wall (x = r.x - 3.5)
      window.addWallBox(7, 3, 0.2, r.x - 3.5, 1.5, r.z, new THREE.MeshStandardMaterial({color:0x1a0a2e, emissive:0x0d0520, emissiveIntensity:0.3}));
      
      // Ceiling (thin, no collision via wallBoxes)
      var ceil = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x2a1050, emissive:0x1a0a3e, emissiveIntensity:0.2}));
      ceil.position.set(r.x, 3, r.z); scene.add(ceil);
      
      // Neon floor with grid pattern
      var floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0d0d1a, emissive:0x1a0a2e, emissiveIntensity:0.1}));
      floor.position.set(r.x, 0, r.z); floor.receiveShadow = true; scene.add(floor);
      
      // Floor grid lines
      for (var i = -3; i <= 3; i++) {
        var line1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.02, 0.03), new THREE.MeshStandardMaterial({color:0x4a2aff, emissive:0x4a2aff, emissiveIntensity:0.2}));
        line1.position.set(r.x + i, 0.06, r.z); scene.add(line1);
        var line2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 6.8), new THREE.MeshStandardMaterial({color:0x4a2aff, emissive:0x4a2aff, emissiveIntensity:0.2}));
        line2.position.set(r.x, 0.06, r.z + i); scene.add(line2);
      }
      
      // Neon strips on walls
      var stripMat = new THREE.MeshStandardMaterial({color:0xff2d7a, emissive:0xff2d7a, emissiveIntensity:0.5});
      for (var s = -2; s <= 2; s += 4) {
        var strip1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 6), stripMat);
        strip1.position.set(r.x - 3.45, 2.5, r.z + s); scene.add(strip1);
        var strip2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), stripMat);
        strip2.position.set(r.x + s, 2.5, r.z - 3.45); scene.add(strip2);
      }
      
      // CREATE TARGETS based on config
      var count = (cfg && cfg.targetCount) ? cfg.targetCount : 5;
      var speed = (cfg && cfg.targetSpeed) ? cfg.targetSpeed : 1.0;
      var pattern = (cfg && cfg.spawnPattern) ? cfg.spawnPattern : 'random';
      
      for (var i = 0; i < count; i++) {
        // Target: a disc (cylinder) + ring
        var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), new THREE.MeshStandardMaterial({color:0xff2d7a, emissive:0xff2d7a, emissiveIntensity:0.3}));
        var ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 16), new THREE.MeshStandardMaterial({color:0xffffff, emissive:0xffffff, emissiveIntensity:0.1, side: THREE.DoubleSide}));
        
        // Position randomly or in pattern
        var tx, tz, ty = 1.5 + Math.random() * 1.2;
        if (pattern === 'circle') {
          var angle = (i / count) * Math.PI * 2;
          tx = r.x + Math.cos(angle) * 2;
          tz = r.z + Math.sin(angle) * 2;
        } else if (pattern === 'wave') {
          tx = r.x + (i - count/2) * 1.2;
          tz = r.z + Math.sin(i * 1.5) * 1.5;
        } else {
          tx = r.x + (Math.random() - 0.5) * 4;
          tz = r.z + (Math.random() - 0.5) * 4;
        }
        
        disc.position.set(tx, ty, tz);
        ring.position.set(tx, ty, tz);
        ring.rotation.x = Math.PI / 2;
        scene.add(disc); scene.add(ring);
        
        state.targets.push({
          disc: disc, ring: ring,
          baseX: tx, baseY: ty, baseZ: tz,
          speed: speed * (0.5 + Math.random()),
          phase: Math.random() * Math.PI * 2,
          alive: true,
          hit: false
        });
      }
      
      // "SHOOT" text in neon on back wall
      var canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff2d7a'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center';
      ctx.shadowColor = '#ff2d7a'; ctx.shadowBlur = 20;
      ctx.fillText('SHOOT', 128, 48);
      var tex = new THREE.CanvasTexture(canvas);
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.8), new THREE.MeshStandardMaterial({map: tex, emissive: 0xff2d7a, emissiveIntensity: 0.3, transparent: true}));
      sign.position.set(r.x - 3.4, 2.2, r.z);
      scene.add(sign);
    },
    
    enter: function(idx, cfg) {
      state.targets.forEach(function(t) { t.alive = true; t.hit = false; });
      state.completed = false;
      state.entered = true;
    },
    
    update: function(dt) {
      if (state.completed || !state.entered) return;
      var allDead = true;
      state.targets.forEach(function(t) {
        if (!t.alive || t.hit) return;
        allDead = false;
        // Bob/move targets
        t.disc.position.y = t.baseY + Math.sin(performance.now() * 0.001 * t.speed + t.phase) * 0.5;
        t.disc.position.x = t.baseX + Math.cos(performance.now() * 0.001 * t.speed * 0.7 + t.phase) * 0.3;
        t.ring.position.copy(t.disc.position);
        t.ring.rotation.x = Math.PI / 2;
        // Rotate disc
        t.disc.rotation.y += dt * t.speed;
      });
      if (allDead && state.targets.length > 0) {
        state.completed = true;
        window.completeRoomGame(0);
      }
    },
    
    click: function() {
      if (state.completed || !state.entered) return false;
      // Raycast from camera center
      var scene = window.getScene(), camera = window.getCamera();
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      
      // Check hit on any alive target disc
      for (var i = 0; i < state.targets.length; i++) {
        var t = state.targets[i];
        if (!t.alive || t.hit) continue;
        var intersects = raycaster.intersectObject(t.disc);
        if (intersects.length > 0) {
          t.hit = true;
          // Explosion effect: particles
          var pCount = 8;
          for (var p = 0; p < pCount; p++) {
            var particle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshStandardMaterial({color: 0xff2d7a, emissive: 0xff2d7a, emissiveIntensity: 0.5}));
            particle.position.copy(t.disc.position);
            scene.add(particle);
            window.S.particles.push({
              mesh: particle,
              vel: new THREE.Vector3((Math.random()-0.5)*3, Math.random()*3, (Math.random()-0.5)*3),
              life: 0.5 + Math.random() * 0.5
            });
          }
          scene.remove(t.disc); scene.remove(t.ring);
          window.showNotification('🎯 Target destroyed!', '#ff2d7a');
          window.playNote(880, 0.1, 'sine');
          return true;
        }
      }
      return false;
    },
    
    interact: function() { return false; },
    
    hud: function(timer, prog, cfg) {
      var alive = state.targets.filter(function(t) { return t.alive && !t.hit; }).length;
      var total = state.targets.length;
      timer.textContent = '🎯 ' + alive + '/' + total;
      prog.innerHTML = '';
      state.targets.forEach(function(t) {
        var dot = document.createElement('div'); dot.className = 'dot' + (t.hit ? ' done' : '');
        prog.appendChild(dot);
      });
    }
  };
})();
