(function() {
  var idx = 4;
  var state = { ingredients: [], sequence: [], currentStep: 0, completed: false, entered: false, 
    timer: 30, activeIngredients: [], spawnTimer: 0, falling: [] };
  
  var INGREDIENT_TYPES = [
    { name: 'Tomato', color: 0xff4444, emoji: '🍅', shape: 'sphere' },
    { name: 'Cheese', color: 0xffdd44, emoji: '🧀', shape: 'box' },
    { name: 'Basil', color: 0x44dd44, emoji: '🌿', shape: 'cone' },
    { name: 'Pepper', color: 0xff8800, emoji: '🌶️', shape: 'cylinder' },
    { name: 'Egg', color: 0xffffcc, emoji: '🥚', shape: 'sphere' },
    { name: 'Mushroom', color: 0xccaa88, emoji: '🍄', shape: 'box' }
  ];

  window.roomGames[4] = {
    build: function(r, idx, cfg) {
      var scene = window.getScene();
      
      // Kitchen walls - warm colored
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z - 3.5, new THREE.MeshStandardMaterial({color:0x2a1a0a, emissive:0x1a100a, emissiveIntensity:0.1}));
      window.addWallBox(0.2, 3, 7, r.x, 1.5, r.z + 3.5, new THREE.MeshStandardMaterial({color:0x2a1a0a, emissive:0x1a100a, emissiveIntensity:0.1}));
      window.addWallBox(7, 3, 0.2, r.x - 3.5, 1.5, r.z, new THREE.MeshStandardMaterial({color:0x2a1a0a, emissive:0x1a100a, emissiveIntensity:0.1}));
      
      var ceil = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x3a2a1a, emissive:0x2a1a0a, emissiveIntensity:0.1}));
      ceil.position.set(r.x, 3, r.z); scene.add(ceil);
      
      // Floor - tile pattern
      var floor = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 6.8), new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:0.6}));
      floor.position.set(r.x, 0, r.z); floor.receiveShadow = true; scene.add(floor);
      
      // Floor tiles (grid)
      var tileMat = new THREE.MeshStandardMaterial({color:0x2a2a2a, roughness:0.5});
      for (var tx = -3; tx < 3; tx++) for (var tz = -3; tz < 3; tz++) {
        if ((tx + tz) % 2 === 0) {
          var tile = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.9), tileMat);
          tile.position.set(r.x + tx + 0.5, 0.06, r.z + tz + 0.5);
          scene.add(tile);
        }
      }
      
      // Counter/table in center
      var tableMat = new THREE.MeshStandardMaterial({color:0x4a3520, roughness:0.7});
      var table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1.5), tableMat);
      table.position.set(r.x, 0.2, r.z);
      table.castShadow = true; table.receiveShadow = true;
      scene.add(table);
      
      // Table surface
      var surface = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshStandardMaterial({color:0x5a4530, roughness:0.4}));
      surface.rotation.x = -Math.PI/2;
      surface.position.set(r.x, 0.41, r.z);
      scene.add(surface);
      
      // Recipe display on back wall
      var canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a0a00'; ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#ffaa44'; ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, 246, 118);
      ctx.fillStyle = '#ffaa44'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
      ctx.fillText('🍳 RECIPE', 128, 30);
      ctx.fillStyle = '#ffcc88'; ctx.font = '14px monospace';
      ctx.fillText('Collect in order!', 128, 60);
      var tex = new THREE.CanvasTexture(canvas);
      var recipeSign = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshStandardMaterial({map: tex, emissive: 0xffaa44, emissiveIntensity: 0.1}));
      recipeSign.position.set(r.x - 3.45, 1.8, r.z);
      scene.add(recipeSign);
      
      // Generate recipe sequence
      var seqLen = (cfg && cfg.sequenceLength) ? cfg.sequenceLength : 4;
      var available = INGREDIENT_TYPES.slice();
      state.sequence = [];
      for (var s = 0; s < seqLen; s++) {
        var pick = available[Math.floor(Math.random() * available.length)];
        state.sequence.push(pick);
      }
      
      state.timer = (cfg && cfg.timeLimit) ? cfg.timeLimit : 25;
      state.currentStep = 0;
      state.activeIngredients = [];
      state.falling = [];
    },
    
    enter: function(idx, cfg) {
      state.currentStep = 0;
      state.completed = false;
      state.entered = true;
      state.activeIngredients = [];
      state.falling = [];
      state.spawnTimer = 1.0;
      // Regenerate sequence on new enter
      var seqLen = (cfg && cfg.sequenceLength) ? cfg.sequenceLength : 4;
      var available = INGREDIENT_TYPES.slice();
      state.sequence = [];
      for (var s = 0; s < seqLen; s++) {
        var pick = available[Math.floor(Math.random() * available.length)];
        state.sequence.push(pick);
      }
      state.timer = (cfg && cfg.timeLimit) ? cfg.timeLimit : 25;
      window.showNotification('🍳 Follow the recipe! Ingredients falling!', '#ffaa44');
    },
    
    update: function(dt) {
      if (state.completed || !state.entered) return;
      
      state.timer -= dt;
      if (state.timer <= 0) {
        window.gameOver();
        return;
      }
      
      // Update falling ingredients
      var scene = window.getScene();
      for (var i = state.falling.length - 1; i >= 0; i--) {
        var f = state.falling[i];
        f.pos.y -= (f.speed || 1.5) * dt;
        f.mesh.position.y = f.pos.y;
        
        // Spin
        f.mesh.rotation.y += dt * 2;
        f.mesh.rotation.x += dt * 1.5;
        
        // If hit ground (table height is 0.4)
        if (f.pos.y < 0.4) {
          scene.remove(f.mesh);
          state.falling.splice(i, 1);
          // Player missed it - don't count as wrong, just missed
          continue;
        }
        
        // Check if player caught it (proximity to player)
        var player = window.player;
        var dist = Math.hypot(player.x - f.pos.x, player.z - f.pos.z);
        if (dist < 1.0 && f.pos.y < 1.2) {
          scene.remove(f.mesh);
          state.falling.splice(i, 1);
          // Check if correct ingredient
          var required = state.sequence[state.currentStep];
          if (f.type === required) {
            state.currentStep++;
            window.playNote(523 * state.currentStep, 0.15, 'sine');
            window.showNotification('✅ ' + required.name + ' collected!', '#44ff88');
            if (state.currentStep >= state.sequence.length) {
              state.completed = true;
              window.completeRoomGame(4);
            }
          } else {
            window.playNote(200, 0.2, 'sawtooth');
            window.showNotification('❌ Wrong ingredient!', '#ff4444');
            window.S.shakeOffset = { x: 0.1, y: 0.05 };
            window.S.shakeTimer = 0.1;
          }
        }
      }
      
      // Spawn ingredients
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = 0.8 + Math.random() * 0.5;
        this._spawnIngredient();
      }
    },
    
    _spawnIngredient: function() {
      var scene = window.getScene();
      var r = window.ROOMS[4];
      
      // Pick random ingredient type
      var ing = INGREDIENT_TYPES[Math.floor(Math.random() * INGREDIENT_TYPES.length)];
      
      // Create mesh based on shape
      var mesh;
      switch(ing.shape) {
        case 'sphere': mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), 
          new THREE.MeshStandardMaterial({color: ing.color, emissive: ing.color, emissiveIntensity: 0.2})); break;
        case 'box': mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), 
          new THREE.MeshStandardMaterial({color: ing.color, emissive: ing.color, emissiveIntensity: 0.2})); break;
        case 'cone': mesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), 
          new THREE.MeshStandardMaterial({color: ing.color, emissive: ing.color, emissiveIntensity: 0.2})); break;
        case 'cylinder': mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), 
          new THREE.MeshStandardMaterial({color: ing.color, emissive: ing.color, emissiveIntensity: 0.2})); break;
      }
      
      // Random position above room
      var x = r.x + (Math.random() - 0.5) * 3;
      var z = r.z + (Math.random() - 0.5) * 3;
      mesh.position.set(x, 3.5, z);
      mesh.castShadow = true;
      scene.add(mesh);
      
      state.falling.push({
        mesh: mesh, pos: new THREE.Vector3(x, 3.5, z),
        speed: 1.0 + Math.random() * 1.5,
        type: ing,
        caught: false
      });
    },
    
    click: function() { return false; },
    interact: function() { return false; },
    
    hud: function(timer, prog, cfg) {
      var secs = Math.max(0, Math.ceil(state.timer));
      var m = Math.floor(secs / 60), s = secs % 60;
      timer.textContent = '🍳 ' + m + ':' + (s < 10 ? '0' : '') + s;
      
      // Show recipe sequence
      prog.innerHTML = '';
      state.sequence.forEach(function(ing, i) {
        var dot = document.createElement('div'); 
        dot.className = 'dot' + (i < state.currentStep ? ' done' : '');
        dot.textContent = ing.emoji;
        dot.style.cssText = 'width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;background:' + (i < state.currentStep ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)') + ';border:1px solid ' + (i === state.currentStep ? '#ffaa44' : 'rgba(255,255,255,0.15)') + ';box-shadow:' + (i === state.currentStep ? '0 0 8px rgba(255,170,68,0.5)' : 'none');
        prog.appendChild(dot);
      });
    }
  };
})();
