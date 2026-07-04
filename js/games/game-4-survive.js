/* Room 4: Shadow Basement — Survive monster ambush */
window.roomGames[4] = {
  build(r) {
    const scene = getScene();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3, 8), pMat);
      p.position.set(r.x + Math.cos(a) * 2.5, 1.5, r.z + Math.sin(a) * 2.5);
      scene.add(p);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x662222, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(r.x, 0.05, r.z);
    scene.add(ring);
    const inner = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x883333, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(r.x, 0.04, r.z);
    scene.add(inner);
  },
  enter() {
    if (S.currentRoom === 4 && !S.roomsDone[4] && (S.monstersKilled || 0) === 0) {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, rad = 1.5 + Math.random() * 1;
        spawnMonster(ROOMS[4].x + Math.cos(a) * rad, ROOMS[4].z + Math.sin(a) * rad, false);
      }
      showNotification('\uD83D\uDC79 Monsters! Kill them!', '#ff4444');
    }
  },
  update(dt) {
    if (!S.roomsDone[4] && (S.monstersKilled || 0) >= 5) completeRoomGame(4);
  },
  hud(timer, prog) {
    timer.textContent = '\uD83D\uDC80 ' + (S.monstersKilled || 0) + '/5';
    prog.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('span');
      if (i < (S.monstersKilled || 0)) d.className = 'done';
      prog.appendChild(d);
    }
  }
};
