/* Room 2: Moonlit Garden — Click to collect glowing orbs */
window.roomGames[2] = {
  build(r) {
    const scene = getScene();
    const om = new THREE.MeshStandardMaterial({ color: 0x88ffaa, emissive: 0x44ff88, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 });
    const pos = [[-1.5, 0.6, -1.5], [1.5, 0.6, 1.5], [-1, 0.6, 1.8], [1.8, 0.6, -1], [0, 0.6, 0]];
    S.orbs = [];
    pos.forEach(p => {
      const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), om);
      o.position.set(r.x + p[0], p[1], r.z + p[2]);
      o.userData.collected = false;
      scene.add(o);
      S.orbs.push(o);
    });
    const pc = [0xff6b7d, 0xffaacc, 0xffffff, 0xc9a6e0];
    for (let i = 0; i < 8; i++) {
      const fg = new THREE.Group();
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x3f9153 }));
      st.position.y = 0.15;
      fg.add(st);
      for (let j = 0; j < 6; j++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshStandardMaterial({ color: pc[j % 4], roughness: 0.5 }));
        p.scale.set(1, 0.5, 1.5);
        const a = j / 6 * Math.PI * 2;
        p.position.set(Math.cos(a) * 0.12, 0.35, Math.sin(a) * 0.12);
        fg.add(p);
      }
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xffc94d }));
      c.position.y = 0.35;
      fg.add(c);
      const ang = Math.random() * Math.PI * 2, rad = 1 + Math.random() * 1.5;
      fg.position.set(r.x + Math.cos(ang) * rad, 0, r.z + Math.sin(ang) * rad);
      scene.add(fg);
    }
  },
  click() {
    if (S.currentRoom !== 2 || S.roomsDone[2]) return false;
    for (const o of S.orbs) {
      if (o.userData.collected) continue;
      if (Math.hypot(player.x - o.position.x, player.z - o.position.z) < 1.5) {
        o.userData.collected = true;
        getScene().remove(o);
        S.orbsCollected = (S.orbsCollected || 0) + 1;
        playNote(660, 0.1, 'sine');
        showNotification('\uD83C\uDF38 ' + S.orbsCollected + '/' + S.orbs.length, '#88ffaa');
        if (S.orbsCollected >= S.orbs.length) completeRoomGame(2);
        return true;
      }
    }
    return false;
  },
  update(dt) {
    S.orbs.forEach(o => { if (!o.userData.collected) { o.rotation.x += dt * 1.2; o.rotation.y += dt * 0.8; } });
  },
  hud(timer, prog) {
    S.orbsCollected = S.orbsCollected || 0;
    timer.textContent = '\uD83C\uDF38 ' + S.orbsCollected + '/' + S.orbs.length;
    prog.innerHTML = '';
    for (let i = 0; i < S.orbs.length; i++) {
      const d = document.createElement('span');
      if (i < S.orbsCollected) d.className = 'done';
      prog.appendChild(d);
    }
  }
};
