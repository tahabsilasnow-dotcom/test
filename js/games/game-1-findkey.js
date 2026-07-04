/* Room 1: Golden Gallery — Find the hidden key */
window.roomGames[1] = {
  build(r) {
    const scene = window.getScene();
    // Picture frames on walls
    for (let i=-2;i<=2;i+=2) {
      const f=new THREE.Mesh(new THREE.BoxGeometry(0.8,1,0.05),new THREE.MeshStandardMaterial({color:0x8a6a4b}));
      f.position.set(r.x+i,1.6,r.z-3.4); scene.add(f);
    }
    // Hidden key
    const km=new THREE.MeshStandardMaterial({color:0xffc94d,emissive:0xffc94d,emissiveIntensity:0.3,metalness:0.8});
    const kg=new THREE.Group();
    const kh=new THREE.Mesh(new THREE.TorusGeometry(0.08,0.035,8,12),km);kh.rotation.x=Math.PI/2;kg.add(kh);
    const ks=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.14),km);ks.position.z=0.12;kg.add(ks);
    kg.position.set(r.x+1.5,0.7,r.z+2); scene.add(kg);
    S.keyMesh=kg;
    S.keyGlow=new THREE.PointLight(0xffc94d,0.5,2);S.keyGlow.position.copy(kg.position);scene.add(S.keyGlow);
  },
  interact() {
    if (!S.keyCollected&&S.keyMesh) {
      const d=Math.hypot(player.x-S.keyMesh.position.x,player.z-S.keyMesh.position.z);
      if (d<2) {
        S.keyCollected=true; window.getScene().remove(S.keyMesh);
        if (S.keyGlow) window.getScene().remove(S.keyGlow);
        completeRoomGame(1); return true;
      }
    }
    return false;
  },
  update(dt) {
    if (S.keyMesh&&!S.keyCollected) {
      S.keyMesh.rotation.y+=dt*1.5;S.keyMesh.position.y=0.7+Math.sin(performance.now()*0.003)*0.06;
    }
  },
  hud(timer, prog) {
    timer.textContent='🔑';prog.innerHTML='';
    const d=document.createElement('span');if(S.keyCollected)d.className='done';prog.appendChild(d);
  }
};
