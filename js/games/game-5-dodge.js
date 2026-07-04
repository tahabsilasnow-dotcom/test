/* Room 5: Crystal Cavern — Dodge falling crystals 15s */
window.roomGames[5] = {
  timer:0, target:15, active:false, obstacles:[],
  enter() {
    if(S.currentRoom===5&&!S.roomsDone[5]&&!this.active){
      this.active=true;this.timer=0;this.obstacles=[];
      document.getElementById('mgTimer').textContent='⚠️ 0s';
      showNotification('💎 Dodge falling crystals for 15s!','#88aaff');
    }
  },
  update(dt) {
    if(!this.active||S.currentRoom!==5||S.roomsDone[5])return;
    this.timer+=dt;document.getElementById('mgTimer').textContent=`⚠️ ${Math.ceil(this.timer)}s/${this.target}s`;
    const scene=window.getScene();
    if(Math.random()<dt*1.5){
      const r=ROOMS[5];
      const rock=new THREE.Mesh(new THREE.OctahedronGeometry(0.12+Math.random()*0.1,0),new THREE.MeshStandardMaterial({color:0x8888ff,emissive:0x4488ff,emissiveIntensity:0.3}));
      rock.position.set(r.x+(Math.random()-0.5)*6,4,r.z+(Math.random()-0.5)*6);
      rock.userData.vy=1+Math.random()*1.5;scene.add(rock);this.obstacles.push(rock);
    }
    for(let i=this.obstacles.length-1;i>=0;i--){
      const o=this.obstacles[i];o.position.y-=o.userData.vy*dt;o.rotation.x+=dt*2;o.rotation.z+=dt*1.5;
      if(o.position.y<0){scene.remove(o);this.obstacles.splice(i,1);continue;}
      if(Math.hypot(player.x-o.position.x,player.z-o.position.z)<0.5&&o.position.y<1.8){
        S.health-=10;updateHUD();scene.remove(o);this.obstacles.splice(i,1);
        if(S.health<=0)gameOver();
      }
    }
    if(this.timer>=this.target){
      this.active=false;completeRoomGame(5);
      this.obstacles.forEach(o=>scene.remove(o));this.obstacles=[];
    }
  },
  hud(timer, prog) {
    timer.textContent=this.active?'⚠️ DODGE!':'⚡';prog.innerHTML='<span></span>';
  }
};
