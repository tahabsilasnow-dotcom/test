/* Room 0: Welcome Hall — Press E to start */
window.roomGames[0] = {
  build(r) {
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.8,0.6,20),new THREE.MeshStandardMaterial({color:0x6666aa,roughness:0.2,metalness:0.5}));
    fountain.position.set(r.x,0.3,r.z); window.getScene().add(fountain);
    const wm=new THREE.Mesh(new THREE.SphereGeometry(0.25,16,16),new THREE.MeshStandardMaterial({color:0x3f9153,roughness:0.5}));
    wm.position.set(r.x,0.7,r.z); window.getScene().add(wm);
  },
  interact() {
    if (!S.roomsDone[0]) { completeRoomGame(0); showNotification('🌅 The museum awakens...','#ffc94d'); return true; }
    return false;
  },
  hud(timer, prog) {
    timer.textContent = '✨';
    prog.innerHTML = '<span style="opacity:0.5">Press E at the fountain</span>';
  }
};
