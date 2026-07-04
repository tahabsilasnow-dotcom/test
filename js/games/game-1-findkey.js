/* Room 1: Golden Gallery — Find the golden key */
window.roomGames[1] = {
  build(r) {
    const scene = getScene();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4b, roughness: 0.7 });
    const offsets = [[-1.5, -1], [0, 1.5], [1.5, -1]];
    offsets.forEach(([dx, dz]) => {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8), pMat);
      ped.position.set(r.x + dx, 0.2, r.z + dz);
      scene.add(ped);
    });
    const km = new THREE.MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffc94d, emissiveIntensity: 0.3, metalness: 0.8 });
    const kg = new THREE.Group();
    const kh = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 12), km);
    kh.rotation.x = Math.PI / 2;
    kg.add(kh);
    const ks = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.14), km);
    ks.position.z = 0.12;
    kg.add(ks);
    kg.position.set(r.x, 0.7, r.z + 1.5);
    scene.add(kg);
    S.keyMesh = kg;
    S.keyGlow = new THREE.PointLight(0xffc94d, 0.5, 2);
    S.keyGlow.position.copy(kg.position);
    scene.add(S.keyGlow);
  },
  interact() {
    if (!S.keyCollected && S.keyMesh && Math.hypot(player.x - S.keyMesh.position.x, player.z - S.keyMesh.position.z) < 2) {
      S.keyCollected = true;
      getScene().remove(S.keyMesh);
      if (S.keyGlow) getScene().remove(S.keyGlow);
      showNotification('\uD83D\uDD11 Golden key found!', '#ffc94d');
      completeRoomGame(1);
      return true;
    }
    return false;
  },
  update(dt) {
    if (S.keyMesh && !S.keyCollected) {
      S.keyMesh.rotation.y += dt * 1.5;
      S.keyMesh.position.y = 0.7 + Math.sin(performance.now() * 0.003) * 0.06;
    }
  },
  hud(timer, prog) {
    timer.textContent = '\uD83D\uDD11';
    prog.innerHTML = '';
    const d = document.createElement('span');
    if (S.keyCollected) d.className = 'done';
    prog.appendChild(d);
  }
};
