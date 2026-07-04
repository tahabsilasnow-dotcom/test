/* Room 7: Storm Rooftop — Final boss */
window.roomGames[7] = {
  enter() {
    if(S.currentRoom===7&&!S.roomsDone[7]&&!S.bossAlive){
      spawnMonster(ROOMS[7].x,ROOMS[7].z,true);
      showNotification('👹 FINAL BOSS!','#ff4444');
    }
  },
  update(dt) {
    if(S.bossAlive){
      const boss=S.monsters.find(m=>m.isBoss&&m.alive);
      if(boss)document.getElementById('bossFill').style.width=Math.max(0,(boss.health/150)*100)+'%';
    }
  },
  hud(timer, prog) {
    timer.textContent=S.bossAlive?'👹 BOSS':'⚔️';prog.innerHTML='';
  }
};
