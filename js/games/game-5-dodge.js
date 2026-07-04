/* Room 5: Crystal Cavern — Dodge falling crystals for 10s */
window.roomGames[5] = {
  timer: 0, target: 10, active: false, obstacles: [],
  build(r) {
    const scene = getScene();
    const cMat = new THREE.MeshStandardMaterial({ color: 0x8888ff, emissive: 0x4488ff, emissiveIntensity: 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, rad = 1.5 + Math.random() * 1.5;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.15 + Math.random() * 0.1, 0), cMat);
      c.position.set(r.x + Math.cos(a) * rad, 0.3 + Math.random() * 0.5, r.z + Math.sin(a) * rad);
      scene.add(c);
    }
  },
  enter() {
    if (S.currentRoom === 5 && !S.roomsDone[5] && !this.active) {
      this.obstacles.forEach(o => getScene().remove(o));
      this.active = true;
      this.timer = 0;
      this.obstacles = [];
      document.getElementById('mgTimer').textContent = '\u26A0\uFE0F 0s';
      showNotification('\uD83D\uDC8E Dodge falling crystals for 10s!', '#88aaff');
    }
  },
  update(dt) {
    if (!this.active || S.currentRoom !== 5 || S.roomsDone[5]) return;
    this.timer += dt;
    document.getElementById('mgTimer').textContent = '\u26A0\uFE0F ' + Math.ceil(this.timer) + 's/' + this.target + 's';
    const scene = getScene();
    if (Math.random() < dt * 1.5) {
      const r = ROOMS[5];
      const rock = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + Math.random() * 0.1, 0),
        new THREE.MeshStandardMaterial({ color: 0x8888ff, emissive: 0x4488ff, emissiveIntensity: 0.3 }));
      rock.position.set(r.x + (Math.random() - 0.5) * 6, 4, r.z + (Math.random() - 0.5) * 6);
      rock.userData.vy = 1 + Math.random() * 1.5;
      scene.add(rock);
      this.obstacles.push(rock);
    }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.position.y -= o.userData.vy * dt;
      o.rotation.x += dt * 2;
      o.rotation.z += dt * 1.5;
      if (o.position.y < 0) { scene.remove(o); this.obstacles.splice(i, 1); continue; }
      if (Math.hypot(player.x - o.position.x, player.z - o.position.z) < 0.5 && o.position.y < 1.8) {
        S.health -= 8;
        updateHUD();
        scene.remove(o);
        this.obstacles.splice(i, 1);
        if (S.health <= 0) gameOver();
      }
    }
    if (this.timer >= this.target) {
      this.active = false;
      this.obstacles.forEach(o => scene.remove(o));
      this.obstacles = [];
      completeRoomGame(5);
    }
  },
  hud(timer, prog) {
    timer.textContent = this.active ? '\u26A0\uFE0F DODGE!' : '\u26A1';
    prog.innerHTML = '<span></span>';
  }
};
