/* Room 3: Forgotten Library — Simon Says memory game */
window.roomGames[3] = {
  sequence: [], playerIdx: 0, phase: 'idle', pads: [],
  build(r) {
    const scene = getScene();
    const colors = [0xff4444, 0x44ff44, 0x4488ff, 0xffdd44];
    const tones = [261, 329, 392, 523];
    this.pads = [];
    colors.forEach((c, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, emissive: c, emissiveIntensity: 0.1 });
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), mat);
      p.rotation.x = -Math.PI / 2;
      const a = i / 4 * Math.PI * 2;
      p.position.set(r.x + Math.cos(a) * 1.3, 0.02, r.z + Math.sin(a) * 1.3);
      p.userData = { simonIdx: i, baseColor: c, tone: tones[i], baseIntensity: 0.1 };
      scene.add(p);
      this.pads.push(p);
    });
  },
  enter() {
    if (S.currentRoom === 3 && !S.roomsDone[3] && this.phase === 'idle') {
      this.sequence = [];
      this.playerIdx = 0;
      this.phase = 'wait';
      setTimeout(() => this.addStep(), 1000);
    }
  },
  addStep() {
    if (S.roomsDone[3] || S.currentRoom !== 3) return;
    this.sequence.push(Math.floor(Math.random() * 4));
    this.playerIdx = 0;
    this.phase = 'showing';
    this.playSeq();
  },
  playSeq() {
    let i = 0;
    const self = this;
    function next() {
      if (i >= self.sequence.length) { self.phase = 'input'; return; }
      const idx = self.sequence[i], pad = self.pads[idx];
      if (pad) {
        pad.material.emissiveIntensity = 0.8;
        playNote(pad.userData.tone, 0.2, 'sine');
        setTimeout(() => { if (pad) pad.material.emissiveIntensity = 0.1; }, 300);
      }
      i++;
      setTimeout(next, 500);
    }
    next();
  },
  click() {
    if (this.phase !== 'input' || S.currentRoom !== 3 || S.roomsDone[3]) return false;
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1, 0, 0), getPitch()).applyAxisAngle(new THREE.Vector3(0, 1, 0), getYaw());
    const ray = new THREE.Raycaster();
    ray.set(getCamera().position, dir);
    let hitPad = -1;
    this.pads.forEach(p => {
      if (getCamera().position.distanceTo(p.position) < 4 && ray.ray.distanceToPoint(p.position) < 0.3)
        hitPad = p.userData.simonIdx;
    });
    if (hitPad < 0) return true;
    const expected = this.sequence[this.playerIdx];
    if (hitPad === expected) {
      playNote(this.pads[hitPad].userData.tone, 0.15, 'sine');
      this.playerIdx++;
      if (this.playerIdx >= this.sequence.length) {
        if (this.sequence.length >= 5) {
          completeRoomGame(3);
        } else {
          this.phase = 'wait';
          showNotification('\u2705 Good! Next round...', '#44ff88');
          setTimeout(() => this.addStep(), 800);
        }
      }
    } else {
      playNote(150, 0.3, 'sawtooth');
      this.phase = 'wait';
      showNotification('\u274C Wrong! Try again...', '#ff4444');
      setTimeout(() => { this.playerIdx = 0; this.phase = 'showing'; this.playSeq(); }, 1200);
    }
    return true;
  },
  update(dt) {
    if (this.pads && (this.phase === 'idle' || this.phase === 'input')) {
      const val = 0.08 + Math.sin(performance.now() * 0.003) * 0.05;
      this.pads.forEach(p => { p.material.emissiveIntensity = val; });
    }
  },
  hud(timer, prog) {
    timer.textContent = '\uD83C\uDFAF ' + this.sequence.length + '/5';
    prog.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('span');
      if (i < this.sequence.length) d.className = 'done';
      prog.appendChild(d);
    }
  }
};
