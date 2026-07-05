(function() {
  var idx = 1;
  var state = { keys: [], keysFound: 0, totalKeys: 0, completed: false, entered: false, flashlight: null, flashlightOn: true };
  var room = null;

  window.roomGames[1] = {
    build: function(r, idx, cfg) {
      room = r;
      var scene = window.getScene();
      
      // Dark walls
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z - 3.5, new THREE.MeshStandardMaterial({color:0x0a0a14, emissive:0x050510, emissiveIntensity:0.1}));
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z + 3.5, new THREE.MeshStandardMaterial({color:0x0a0a14, emissive:0x050510, emissiveIntensity:0.1}));
      window.addWallBox(7, 3, 0.2, r.x - 3.5, 1.5, r.z, new THREE.MeshStandardMaterial({color:0x0a0a14, emissive:0x050510, emissiveIntensity:0.1}));
      
      var ceil = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0d0d1a}));
      ceil.position.set(r.x, 3, r.z); scene.add(ceil);
      
      // Floor with subtle grid
      var floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0a0a14, roughness:0.9}));
      floor.position.set(r.x, 0, r.z); floor.receiveShadow = true; scene.add(floor);
      
      // Darken the room by reducing ambient
      // (engine already has amb/hemi - we rely on darkness setting)
      
      // Shelves/obstacles (crates) for atmosphere
      var crateMat = new THREE.MeshStandardMaterial({color:0x1a1420, roughness:0.8});
      var cratePositions = [[-1.5, 0.25, -1], [1.5, 0.25, 1.5], [-1, 0.25, 2], [2, 0.25, -1.5], [-2, 0.75, 0.5]];
      cratePositions.forEach(function(pos) {
        var crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crateMat);
        crate.position.set(r.x + pos[0], pos[1], r.z + pos[2]);
        crate.castShadow = true; crate.receiveShadow = true;
        scene.add(crate);
        // Add to wallBoxes for collision
        var bx = new THREE.Box3(new THREE.Vector3(r.x+pos[0]-0.25, 0, r.z+pos[2]-0.25), new THREE.Vector3(r.x+pos[0]+0.25, pos[1]+0.5, r.z+pos[2]+0.25));
        window.getWallBoxes().push(bx);
      });
      
      // Create glowing keys
      var totalKeys = (cfg && cfg.keyCount) ? cfg.keyCount : 3;
      state.totalKeys = totalKeys;
      
      var colors = [0xffd700, 0x00ffff, 0xff69b4, 0x7fff00];
      for (var i = 0; i < totalKeys; i++) {
        // Key shape: small torus + cylinder shaft
        var keyGroup = new THREE.Group();
        var bow = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 8, 12), new THREE.MeshStandardMaterial({color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 0.8}));
        bow.rotation.x = Math.PI / 2;
        var shaft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), new THREE.MeshStandardMaterial({color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 0.8}));
        shaft.position.z = 0.08;
        keyGroup.add(bow); keyGroup.add(shaft);
        
        // Place key hidden in room (on crates, in corners)
        var keyX = r.x + (Math.random() - 0.5) * 4;
        var keyZ = r.z + (Math.random() - 0.5) * 4;
        keyGroup.position.set(keyX, 0.3, keyZ);
        keyGroup.scale.set(0.8, 0.8, 0.8);
        scene.add(keyGroup);
        
        // Glow point light for key
        var glow = new THREE.PointLight(colors[i % colors.length], 0.5, 2);
        glow.position.set(keyX, 0.3, keyZ);
        scene.add(glow);
        
        state.keys.push({ group: keyGroup, glow: glow, found: false, color: colors[i % colors.length] });
      }
      
      // Vault door decoration on back wall
      var doorCanvas = document.createElement('canvas'); doorCanvas.width = 128; doorCanvas.height = 256;
      var ctx = doorCanvas.getContext('2d');
      ctx.fillStyle = '#1a1420'; ctx.fillRect(0, 0, 128, 256);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 108, 236);
      ctx.beginPath(); ctx.arc(64, 128, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('🔒', 64, 140);
      var doorTex = new THREE.CanvasTexture(doorCanvas);
      var door = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.5), new THREE.MeshStandardMaterial({map: doorTex, emissive: 0xffd700, emissiveIntensity: 0.05}));
      door.position.set(r.x - 3.45, 1.5, r.z);
      scene.add(door);
    },
    
    enter: function(idx, cfg) {
      state.keysFound = 0;
      state.keys.forEach(function(k) { k.found = false; });
      state.completed = false;
      state.entered = true;
      state.flashlightOn = true;
      
      // Create flashlight (spotlight that follows camera)
      var scene = window.getScene();
      if (state.flashlight) { scene.remove(state.flashlight); scene.remove(state.flashlight.target); }
      var fl = new THREE.SpotLight(0xffffcc, 1.5, 12, Math.PI / 6, 0.3, 1.5);
      fl.target.position.set(0, 0, -5);
      fl.angle = Math.PI / 5;
      fl.penumbra = 0.5;
      fl.decay = 1;
      fl.distance = 12;
      fl.castShadow = true;
      scene.add(fl); scene.add(fl.target);
      state.flashlight = fl;
      
      // Show flashlight instruction
      window.showNotification('🔦 Use mouse to look around with flashlight!', '#ffd700');
    },
    
    update: function(dt) {
      if (state.completed || !state.entered) return;
      var camera = window.getCamera();
      
      // Update flashlight position to follow camera
      if (state.flashlight) {
        state.flashlight.position.copy(camera.position);
        var fwd = new THREE.Vector3(0, 0, -1);
        var yaw = window.getYaw ? window.getYaw() : 0;
        var pitch = window.getPitch ? window.getPitch() : 0;
        fwd.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        var right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        fwd.applyAxisAngle(right, pitch);
        state.flashlight.target.position.copy(camera.position).add(fwd.multiplyScalar(5));
        state.flashlight.target.updateMatrixWorld();
      }
      
      // Check proximity to keys
      var player = window.player;
      state.keys.forEach(function(k) {
        if (k.found) return;
        var dist = Math.hypot(player.x - k.group.position.x, player.z - k.group.position.z);
        if (dist < 1.0) {
          k.found = true;
          state.keysFound++;
          window.playNote(523 * (state.keysFound + 1), 0.2, 'sine');
          window.showNotification('🔑 Key ' + state.keysFound + '/' + state.totalKeys + ' found!', '#ffd700');
          // Animate key flying up
          k.group.scale.set(0, 0, 0);
          k.glow.intensity = 0;
          
          if (state.keysFound >= state.totalKeys) {
            state.completed = true;
            window.completeRoomGame(1);
          }
        }
      });
      
      // Animate unfound keys (glow + float)
      state.keys.forEach(function(k) {
        if (k.found) return;
        k.group.position.y = 0.3 + Math.sin(performance.now() * 0.002 + k.group.position.x) * 0.08;
        k.group.rotation.y += dt * 0.5;
        k.glow.intensity = 0.3 + Math.sin(performance.now() * 0.003 + k.group.position.z) * 0.2;
      });
    },
    
    click: function() { return false; },
    interact: function() { return false; },
    
    hud: function(timer, prog, cfg) {
      timer.textContent = '🔑 ' + state.keysFound + '/' + state.totalKeys;
      prog.innerHTML = '';
      state.keys.forEach(function(k) {
        var dot = document.createElement('div'); dot.className = 'dot' + (k.found ? ' done' : '');
        prog.appendChild(dot);
      });
    }
  };
})();
