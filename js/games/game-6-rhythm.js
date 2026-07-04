/* Room 6: Harmonic Hall — Click in rhythm */
window.roomGames[6] = {
  notes:[], score:0, target:8, active:false, scheduled:false,
  enter() {
    if(S.currentRoom===6&&!S.roomsDone[6]&&!this.active&&!this.scheduled){
      this.active=true;this.notes=[];this.score=0;this.scheduled=true;
      document.getElementById('mgTimer').textContent=`🎵 ${this.score}/${this.target}`;
      showNotification('🎵 Click in time with the beat!','#ff66dd');
      this.scheduleNotes();
    }
  },
  scheduleNotes() {
    let t=0;const self=this;
    for(let i=0;i<this.target;i++){
      setTimeout(()=>{
        if(S.roomsDone[6])return;
        playNote([392,440,523,587][Math.floor(Math.random()*4)],0.1,'sine');
        self.notes.push({time:performance.now(),hit:false});
        document.getElementById('mgTimer').textContent=`🎵 ${self.score}/${self.target}`;
        setTimeout(()=>{
          if(self.notes.length>0&&!self.notes[0].hit){
            self.notes.shift();S.health-=5;updateHUD();
            if(S.health<=0)gameOver();
          }
        },400);
      },t);
      t+=1200+Math.random()*400;
    }
    setTimeout(()=>{
      if(self.score>=self.target)completeRoomGame(6);
      else{self.active=false;self.scheduled=false;showNotification('Try again!','#ffaa44');}
    },t+1000);
  },
  click() {
    if(!this.active||S.currentRoom!==6||S.roomsDone[6])return false;
    if(this.notes.length>0){
      this.notes[0].hit=true;this.score++;playNote(880,0.1,'sine');this.notes.shift();
      document.getElementById('mgTimer').textContent=`🎵 ${this.score}/${this.target}`;
      if(this.score>=this.target){this.active=false;completeRoomGame(6);}
    }
    return true;
  },
  hud(timer, prog) {
    timer.textContent=`🎵 ${this.score}/${this.target}`;prog.innerHTML='<span></span>';
  }
};
