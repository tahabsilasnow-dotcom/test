/* Room 6: Harmonic Hall — Click in time with the beat */
window.roomGames[6] = {
  notes: [], score: 0, target: 8, threshold: 6, active: false, scheduled: false,
  build(r) {
    const scene = getScene();
    const colors = [0x8844aa, 0xaa66cc, 0x663388, 0x9955bb];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8),
          new THREE.MeshStandardMaterial({ color: colors[(i + 1) + (j + 1) * 3 & 3], roughness: 0.6 }));
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(r.x + i * 0.85, 0.01, r.z + j * 0.85);
        scene.add(tile);
      }
    }
  },
  enter() {
    if (S.currentRoom === 6 && !S.roomsDone[6] && !this.active && !this.scheduled) {
      this.active = true;
      this.notes = [];
      this.score = 0;
      this.scheduled = true;
      document.getElementById('mgTimer').textContent = '\uD83C\uDFB5 ' + this.score + '/' + this.target;
      showNotification('\uD83C\uDFB5 Click in time with the beat!', '#ff66dd');
      this.scheduleNotes();
    }
  },
  scheduleNotes() {
    const scale = [392, 440, 523, 587, 659];
    let t = 0;
    const self = this;
    for (let i = 0; i < this.target; i++) {
      setTimeout(() => {
        if (S.roomsDone[6] || !self.active) return;
        playNote(scale[Math.floor(Math.random() * scale.length)], 0.1, 'sine');
        self.notes.push({ hit: false });
        document.getElementById('mgTimer').textContent = '\uD83C\uDFB5 ' + self.score + '/' + self.target;
        setTimeout(() => {
          if (self.notes.length > 0 && !self.notes[0].hit) {
            self.notes.shift();
            S.health -= 5;
            updateHUD();
            if (S.health <= 0) gameOver();
          }
        }, 400);
      }, t);
      t += 800;
    }
    setTimeout(() => {
      self.active = false;
      self.scheduled = false;
      if (self.score >= self.threshold) {
        showNotification('\uD83C\uDFB5 ' + self.score + '/' + self.target + ' - Great timing!', '#66ff88');
        completeRoomGame(6);
      } else {
        showNotification('\uD83C\uDFB5 ' + self.score + '/' + self.target + ' - Try again!', '#ffaa44');
      }
    }, t + 1000);
  },
  click() {
    if (!this.active || S.currentRoom !== 6 || S.roomsDone[6]) return false;
    if (this.notes.length > 0) {
      this.notes[0].hit = true;
      this.score++;
      playNote(880, 0.1, 'sine');
      this.notes.shift();
      document.getElementById('mgTimer').textContent = '\uD83C\uDFB5 ' + this.score + '/' + this.target;
    }
    return true;
  },
  hud(timer, prog) {
    timer.textContent = '\uD83C\uDFB5 ' + this.score + '/' + this.target;
    prog.innerHTML = '<span></span>';
  }
};
