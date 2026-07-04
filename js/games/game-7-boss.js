/* Room 7: Storm Rooftop — Final boss */
window.roomGames[7] = {
  build(r) {
    const scene = getScene();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 4, 8), pMat);
      pillar.position.set(r.x + Math.cos(a) * 3.5, 2, r.z + Math.sin(a) * 3.5);
      scene.add(pillar);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8),
      new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(r.x, 0, r.z);
    scene.add(floor);
  },
  enter() {
    if (S.currentRoom === 7 && !S.roomsDone[7] && !S.bossAlive) {
      spawnMonster(ROOMS[7].x, ROOMS[7].z, true);
      showNotification('\uD83D\uDC79 FINAL BOSS!', '#ff4444');
    }
  },
  update(dt) {
    if (S.bossAlive) {
      const boss = S.monsters.find(m => m.isBoss && m.alive);
      if (boss) document.getElementById('bossFill').style.width = Math.max(0, (boss.health / 150) * 100) + '%';
    }
  },
  hud(timer, prog) {
    timer.textContent = S.bossAlive ? '\uD83D\uDC79 BOSS' : '\u2694\uFE0F';
    prog.innerHTML = '';
  }
};
