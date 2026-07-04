/* Room 0: Welcome Hall — Press E at the fountain */
window.roomGames[0] = {
  build(r) {
    const scene = getScene();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.6, 20),
      new THREE.MeshStandardMaterial({ color: 0x6666aa, roughness: 0.2, metalness: 0.5 }));
    base.position.set(r.x, 0.3, r.z);
    scene.add(base);
    const water = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x3f9153, emissive: 0x3f9153, emissiveIntensity: 0.3 }));
    water.position.set(r.x, 0.7, r.z);
    scene.add(water);
    const glow = new THREE.PointLight(0x3f9153, 0.8, 3);
    glow.position.set(r.x, 0.7, r.z);
    scene.add(glow);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x88ffaa, emissive: 0x44ff88, emissiveIntensity: 0.5 });
    S.fountainParticles = [];
    for (let i = 0; i < 25; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pMat);
      const angle = Math.random() * Math.PI * 2;
      p.userData = { angle, rad: 0.3 + Math.random() * 0.4, speed: 0.5 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 };
      p.position.set(r.x + Math.cos(angle) * p.userData.rad, 0.5 + Math.random() * 0.4, r.z + Math.sin(angle) * p.userData.rad);
      scene.add(p);
      S.fountainParticles.push(p);
    }
  },
  update(dt) {
    if (!S.fountainParticles) return;
    const rx = ROOMS[0].x, rz = ROOMS[0].z;
    const t = performance.now() * 0.003;
    S.fountainParticles.forEach(p => {
      p.userData.angle += dt * p.userData.speed;
      p.position.x = rx + Math.cos(p.userData.angle) * p.userData.rad;
      p.position.z = rz + Math.sin(p.userData.angle) * p.userData.rad;
      p.position.y = 0.5 + Math.sin(t + p.userData.phase) * 0.2;
    });
  },
  interact() {
    if (!S.roomsDone[0] && Math.hypot(player.x - ROOMS[0].x, player.z - ROOMS[0].z) < 2) {
      completeRoomGame(0);
      showNotification('\uD83C\uDF05 The museum awakens...', '#ffc94d');
      return true;
    }
    return false;
  },
  hud(timer, prog) {
    timer.textContent = '\u2728';
    prog.innerHTML = '<span style="opacity:0.5">Press E at the fountain</span>';
  }
};
