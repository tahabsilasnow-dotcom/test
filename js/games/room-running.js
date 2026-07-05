(function() {
  var idx = 3;
  var state = { obstacles: [], speed: 5, distance: 0, targetDist: 100, completed: false, entered: false, spawnTimer: 0, playerZ: 0 };

  window.roomGames[3] = {
    build: function(r, idx, cfg) {
      var scene = window.getScene();
      
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z - 3.5, new THREE.MeshStandardMaterial({color:0x0a0a2e, emissive:0x050520, emissiveIntensity:0.2}));
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z + 3.5, new THREE.MeshStandardMaterial({color:0x0a0a2e, emissive:0x050520, emissiveIntensity:0.2}));
      window.addWallBox(7, 3, 0.2, r.x - 3.5, 1.5, r.z, new THREE.MeshStandardMaterial({color:0x0a0a2e, emissive:0x050520, emissiveIntensity:0.2}));
      
      var ceil = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0a0a2e, emissive:0x101040, emissiveIntensity:0.1}));
      ceil.position.set(r.x, 3, r.z); scene.add(ceil);
      
      var floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x0d0d1a, roughness:0.8}));
      floor.position.set(r.x, 0, r.z); floor.receiveShadow = true; scene.add(floor);
      
      var arrowMat = new THREE.MeshStandardMaterial({color:0x4466ff, emissive:0x4466ff, emissiveIntensity:0.2});
      for (var i = -2; i <= 2; i += 2) {
        var arr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.3), arrowMat);
        arr.position.set(r.x + i, 0.06, r.z); scene.add(arr);
      }
      
      var canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4466ff'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
      ctx.shadowColor = '#4466ff'; ctx.shadowBlur = 15;
      ctx.fillText('\uD83C\uDFC1', 64, 48);
      var tex = new THREE.CanvasTexture(canvas);
      var sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), new THREE.MeshStandardMaterial({map: tex, transparent: true}));
      sign.position.set(r.x - 3.4, 1.8, r.z);
      scene.add(sign);
      
      state.speed = (cfg && cfg.speed) ? cfg.speed : 5;
      state.targetDist = (cfg && cfg.corridorLength) ? cfg.corridorLength : 100;
      state.obstacles = [];
    },
    
    enter: function(idx, cfg) {
      state.distance = 0;
      state.completed = false;
      state.entered = true;
      state.obstacles = [];
      state.spawnTimer = 0;
      state.playerZ = 0;
      window.showNotification('\uD83C\uDFC3 Dodge the obstacles! Move left/right!', '#4466ff');
    },
    
    update: function(dt) {
      if (state.completed || !state.entered) return;
      
      state.distance += state.speed * dt;
      state.spawnTimer -= dt;
      
      if (state.spawnTimer <= 0) {
        state.spawnTimer = 0.4 + Math.random() * 0.6;
        this._spawnObstacle();
      }
      
      var player = window.player;
      player.z += state.speed * dt * 0.5;
      
      var r = window.ROOMS[3];
      player.x = Math.max(r.x - 2.5, Math.min(r.x + 2.5, player.x));
      
      var scene = window.getScene();
      for (var i = state.obstacles.length - 1; i >= 0; i--) {
        var o = state.obstacles[i];
        o.pos.z -= state.speed * dt * 0.7;
        o.mesh.position.z = o.pos.z;
        
        if (o.pos.z < player.z - 5) {
          scene.remove(o.mesh);
          if (o.wallBox && window.getWallBoxes) {
            var arr = window.getWallBoxes();
            var wi = arr.indexOf(o.wallBox);
            if (wi >= 0) arr.splice(wi, 1);
          }
          state.obstacles.splice(i, 1);
          continue;
        }
        
        o.mesh.rotation.x += dt * 2;
        o.mesh.rotation.y += dt * 1.5;
        
        if (o.wallBox) {
          o.wallBox.min.x = o.pos.x - 0.3;
          o.wallBox.min.z = o.pos.z - 0.3;
          o.wallBox.max.x = o.pos.x + 0.3;
          o.wallBox.max.z = o.pos.z + 0.3;
        }
      }
      
      if (state.distance >= state.targetDist) {
        state.completed = true;
        player.z = r.z;
        window.completeRoomGame(3);
      }
    },
    
    _spawnObstacle: function() {
      var scene = window.getScene();
      var r = window.ROOMS[3];
      var player = window.player;
      
      var isTall = Math.random() > 0.5;
      var height = isTall ? 2.0 : 0.6;
      var w = 0.4 + Math.random() * 0.3;
      var color = isTall ? 0xff4466 : 0xffaa44;
      var emColor = isTall ? 0xff2244 : 0xff8822;
      
      var mesh = new THREE.Mesh(
        isTall ? new THREE.BoxGeometry(w, height, w) : new THREE.OctahedronGeometry(0.3),
        new THREE.MeshStandardMaterial({color: color, emissive: emColor, emissiveIntensity: 0.3})
      );
      
      var sx = r.x + (Math.random() - 0.5) * 4;
      var sz = player.z + 4 + Math.random() * 2;
      mesh.position.set(sx, height / 2, sz);
      mesh.castShadow = true;
      scene.add(mesh);
      
      var bx = new THREE.Box3(
        new THREE.Vector3(sx - w/2, 0, sz - w/2),
        new THREE.Vector3(sx + w/2, height, sz + w/2)
      );
      window.getWallBoxes().push(bx);
      
      state.obstacles.push({ mesh: mesh, pos: new THREE.Vector3(sx, 0, sz), wallBox: bx, height: height });
    },
    
    click: function() { return false; },
    interact: function() { return false; },
    
    hud: function(timer, prog, cfg) {
      var pct = Math.min(100, Math.floor((state.distance / state.targetDist) * 100));
      timer.textContent = '\uD83C\uDFC3 ' + pct + '%';
      prog.innerHTML = '';
      var dots = Math.floor(pct / 20);
      for (var i = 0; i < 5; i++) {
        var dot = document.createElement('div'); dot.className = 'dot' + (i < dots ? ' done' : '');
        prog.appendChild(dot);
      }
    }
  };
})();
