/* Room 4: Shadow Basement — Survive monster ambush */
window.roomGames[4] = {
  build(r) {
    const scene = window.getScene();
    for(let i=0;i<3;i++){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,3,10),new THREE.MeshStandardMaterial({color:0x333344,roughness:0.9}));
      p.position.set(r.x-2+i*2,1.5,r.z-1.5+(i%2)*3);scene.add(p);
    }
    const circ=new THREE.Mesh(new THREE.RingGeometry(0.8,1,32),new THREE.MeshBasicMaterial({color:0x662222,side:THREE.DoubleSide,transparent:true,opacity:0.4}));
    circ.rotation.x=-Math.PI/2;circ.position.set(r.x,0.05,r.z);scene.add(circ);
  },
  enter() {
    if(S.currentRoom===4&&!S.roomsDone[4]&&S.monstersKilled===0){
      for(let i=0;i<5;i++){const a=Math.random()*Math.PI*2,r=1.5+Math.random()*1;spawnMonster(ROOMS[4].x+Math.cos(a)*r,ROOMS[4].z+Math.sin(a)*r,false);}
      showNotification('👹 Monsters! Kill them!','#ff4444');
    }
  },
  update(dt) {
    if(!S.roomsDone[4]&&S.monstersKilled>=5)completeRoomGame(4);
  },
  hud(timer, prog) {
    timer.textContent=`💀 ${S.monstersKilled}/5`;prog.innerHTML='';
    for(let i=0;i<5;i++){const d=document.createElement('span');if(i<S.monstersKilled)d.className='done';prog.appendChild(d);}
  }
};
