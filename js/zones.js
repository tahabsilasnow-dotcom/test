(function() {

var W = window.World;

var ZONES = [
  {
    id: 0, name: 'The Beginning', x: 0, z: -20,
    desc: 'Where it all started',
    fragment: { type: 'seashell', color: 0xffaa88, emissive: 0xff8844 },
    dialogue: [
      { speaker: '✦ Companion', text: 'Welcome, Houda. This is where your story begins...' },
      { speaker: '✦ Companion', text: 'I\'ve hidden pieces of us across this world. Find them, and you\'ll find something special.' },
      { speaker: '✦ Companion', text: 'Look around — some memories are closer than they seem.' }
    ],
    collectDialogue: [
      { speaker: '✦ Companion', text: 'A seashell... just like the one from our first beach trip. You picked it up and smiled at me.' },
      { speaker: '✦ Companion', text: 'One memory found. Keep going.' }
    ],
    obstacle: 'platform'
  },
  {
    id: 1, name: 'City Lights', x: 0, z: 5,
    desc: 'A walk to remember',
    fragment: { type: 'ticket', color: 0xffdd44, emissive: 0xffaa22 },
    dialogue: [
      { speaker: '✦ Companion', text: 'The city stretches before you. I can still see us walking those streets...' },
      { speaker: '✦ Companion', text: 'Rain was falling that night, but we didn\'t care. We had each other.' },
      { speaker: '✦ Companion', text: 'Find the ticket stub. It\'s hidden somewhere in these streets...' }
    ],
    collectDialogue: [
      { speaker: '✦ Companion', text: 'Our ticket. That first movie together — you were late, and I didn\'t even mind.' },
      { speaker: '✦ Companion', text: 'Two down. One more to go.' }
    ],
    obstacle: 'timing'
  },
  {
    id: 2, name: 'The Summit', x: 0, z: 28,
    desc: 'A view of forever',
    fragment: { type: 'locket', color: 0xff6bcd, emissive: 0xff4488 },
    dialogue: [
      { speaker: '✦ Companion', text: 'The highest point. This is where everything comes together.' },
      { speaker: '✦ Companion', text: 'Reach the top, and you\'ll find the final piece...' },
      { speaker: '✦ Companion', text: 'The view is worth it. I promise.' }
    ],
    collectDialogue: [
      { speaker: '✦ Companion', text: 'A locket... with our picture inside. I\'ve been carrying this with me all along.' },
      { speaker: '✦ Companion', text: 'All three memories. You found every single one.' },
      { speaker: '✦ Companion', text: 'I think it\'s time I showed you what this was really about.' }
    ],
    obstacle: 'wind'
  }
];

var zoneObjects = [];
var fragmentMeshes = [];
var activeObstacles = [];

window.buildZones = function() {
  var scene = W.scene;

  ZONES.forEach(function(zone, idx) {
    var zh = getHeight(zone.x, zone.z);

    // Zone marker / ground decoration
    var ringMat = new THREE.MeshStandardMaterial({
      color: [0xff8844, 0xffdd44, 0xff6bcd][idx],
      emissive: [0xff8844, 0xffdd44, 0xff6bcd][idx],
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.3
    });
    var ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.5, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(zone.x, zh + 0.05, zone.z);
    scene.add(ring);
    zoneObjects.push(ring);

    // Build zone-specific decorations
    if (idx === 0) buildGardenZone(zone, zh);
    if (idx === 1) buildCityZone(zone, zh);
    if (idx === 2) buildSummitZone(zone, zh);
  });

  // Create fragment meshes (hidden until zone is entered)
  ZONES.forEach(function(zone, idx) {
    var zh = getHeight(zone.x, zone.z);
    var fColor = zone.fragment.color;
    var fEm = zone.fragment.emissive;

    var fragGroup = new THREE.Group();

    var glowMat = new THREE.MeshStandardMaterial({
      color: fColor,
      emissive: fEm,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7
    });

    var center = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), glowMat);
    center.position.y = 0.6;
    fragGroup.add(center);

    var inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    inner.position.y = 0.6;
    fragGroup.add(inner);

    var glowPoint = new THREE.PointLight(fColor, 0.6, 4);
    glowPoint.position.y = 0.6;
    fragGroup.add(glowPoint);

    // Spinning ring around fragment
    var ringMat2 = new THREE.MeshBasicMaterial({
      color: fEm,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    var orbitRing = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.32, 16), ringMat2);
    orbitRing.position.y = 0.6;
    orbitRing.userData.parent = fragGroup;
    fragGroup.add(orbitRing);

    fragGroup.position.set(zone.x, zh, zone.z);
    fragGroup.visible = false;
    scene.add(fragGroup);

    fragmentMeshes.push({
      group: fragGroup,
      zone: idx,
      collected: false,
      orbitRing: orbitRing,
      light: glowPoint
    });
  });
};

function buildGardenZone(zone, h) {
  var scene = W.scene;
  var flowerMat = new THREE.MeshStandardMaterial({ color: 0xff88aa, roughness: 0.4 });

  for (var i = 0; i < 8; i++) {
    var a = (i / 8) * Math.PI * 2;
    var r = 0.8 + Math.random() * 0.5;
    var fx = zone.x + Math.cos(a) * r;
    var fz = zone.z + Math.sin(a) * r;
    var fh = getHeight(fx, fz);

    // Simple flower: stem + head
    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.015, 0.15, 4),
      new THREE.MeshStandardMaterial({ color: 0x3a8a4a })
    );
    stem.position.set(fx, fh + 0.075, fz);
    scene.add(stem);

    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshStandardMaterial({
        color: [0xff88aa, 0xffaa88, 0xffccaa, 0xff6699][Math.floor(Math.random() * 4)]
      })
    );
    head.position.set(fx, fh + 0.17, fz);
    scene.add(head);
  }
}

function buildCityZone(zone, h) {
  var scene = W.scene;
  var buildingMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7, metalness: 0.2 });
  var windowMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffdd88, emissiveIntensity: 0.15 });

  // Small buildings
  var positions = [
    { x: -2.5, z: 2.5 }, { x: 2.5, z: 2.5 },
    { x: -2, z: -2 }, { x: 2.8, z: -2.5 }
  ];

  positions.forEach(function(pos) {
    var bh = getHeight(zone.x + pos.x, zone.z + pos.z);
    var bw = 0.6 + Math.random() * 0.4;
    var bd = 0.6 + Math.random() * 0.4;
    var bhgt = 0.5 + Math.random() * 0.5;

    var building = new THREE.Mesh(new THREE.BoxGeometry(bw, bhgt, bd), buildingMat);
    building.position.set(zone.x + pos.x, bh + bhgt / 2, zone.z + pos.z);
    building.castShadow = true;
    scene.add(building);

    // Windows
    for (var wy = 0; wy < 2; wy++) {
      var win = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.1), windowMat);
      win.position.set(zone.x + pos.x + bw / 2 + 0.001, bh + 0.2 + wy * 0.2, zone.z + pos.z);
      scene.add(win);
    }
  });

  // Lamp posts
  var lampPositions = [
    { x: -1.5, z: 0.5 }, { x: 1.5, z: -0.5 }
  ];
  lampPositions.forEach(function(pos) {
    var lh = getHeight(zone.x + pos.x, zone.z + pos.z);
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.5 })
    );
    pole.position.set(zone.x + pos.x, lh + 0.25, zone.z + pos.z);
    scene.add(pole);

    var lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffdd88 })
    );
    lamp.position.set(zone.x + pos.x, lh + 0.52, zone.z + pos.z);
    scene.add(lamp);

    var lp = new THREE.PointLight(0xffdd88, 0.3, 2);
    lp.position.set(zone.x + pos.x, lh + 0.52, zone.z + pos.z);
    scene.add(lp);
  });
}

function buildSummitZone(zone, h) {
  var scene = W.scene;

  // The viewpoint — a stone platform
  var platMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
  var plat = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 0.4, 12), platMat);
  plat.position.set(zone.x, h + 0.2, zone.z);
  plat.castShadow = true;
  plat.receiveShadow = true;
  scene.add(plat);

  // Small cairn (stone stack) on the platform
  var stonePositions = [
    { x: 0.2, y: 0.5, z: 0.1, size: 0.1 },
    { x: -0.1, y: 0.65, z: -0.1, size: 0.08 },
    { x: 0.05, y: 0.78, z: 0.05, size: 0.06 }
  ];
  stonePositions.forEach(function(sp) {
    var stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(sp.size, 0),
      new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.9 })
    );
    stone.position.set(zone.x + sp.x, h + sp.y, zone.z + sp.z);
    scene.add(stone);
  });
}

// Track which zone the player is in
var playerCurrentZone = -1;
var zoneObstaclesActive = false;

window.updateZones = function(dt) {
  var px = W.playerPos.x, pz = W.playerPos.z;

  // Check which zone player is in
  var newZone = -1;
  ZONES.forEach(function(zone, idx) {
    var d = Math.sqrt((px - zone.x) * (px - zone.x) + (pz - zone.z) * (pz - zone.z));
    if (d < 5) newZone = idx;
  });

  if (newZone >= 0 && newZone !== playerCurrentZone && !W.state.zonesDone[newZone]) {
    enterZone(newZone);
  }
  playerCurrentZone = newZone;

  // Update fragment visibility and bobbing
  var nearFragment = false;
  fragmentMeshes.forEach(function(fm) {
    if (fm.collected) return;
    var zone = ZONES[fm.zone];
    if (W.state.zonesDone[fm.zone]) return;
    // Show fragment when player is close enough
    var d = Math.sqrt((px - zone.x) * (px - zone.x) + (pz - zone.z) * (pz - zone.z));
    if (d < 6 && !fm.group.visible) {
      fm.group.visible = true;
    }
    if (fm.group.visible) {
      var zh = getHeight(zone.x, zone.z);
      fm.group.position.y = zh + Math.sin(performance.now() * 0.002) * 0.08;
      fm.group.rotation.y += dt * 0.5;
      if (fm.orbitRing) fm.orbitRing.rotation.z += dt * 0.8;
      if (d < 2.5) nearFragment = true;
    }
  });

  var hint = document.getElementById('interactHint');
  if (nearFragment && !W.state.dialogueActive) {
    hint.classList.add('show');
  } else {
    hint.classList.remove('show');
  }
};

function enterZone(idx) {
  var zone = ZONES[idx];
  W.state.currentZone = idx;
  document.getElementById('zoneName').textContent = zone.name;

  if (!W.state.zonesDone[idx]) {
    showZoneDialogue(idx, 0);
    activateObstacles(idx);
  }
}

window.checkZoneCollect = function() {
  var px = W.playerPos.x, pz = W.playerPos.z;

  for (var i = 0; i < fragmentMeshes.length; i++) {
    var fm = fragmentMeshes[i];
    if (fm.collected || W.state.zonesDone[fm.zone]) continue;
    var zone = ZONES[fm.zone];

    // Must be in the right zone
    if (playerCurrentZone !== fm.zone) return;

    var d = Math.sqrt((px - zone.x) * (px - zone.x) + (pz - zone.z) * (pz - zone.z));
    if (d < 2) {
      fm.collected = true;
      fm.group.visible = false;
      W.state.fragments++;
      W.state.zonesDone[fm.zone] = true;

      // Particles!
      var pos = new THREE.Vector3(zone.x, getHeight(zone.x, zone.z) + 0.6, zone.z);
      window.spawnParticles(pos, 25, zone.fragment.color, 3);
      window.playNote(523, 0.15);
      setTimeout(function() { window.playNote(659, 0.15); }, 150);
      setTimeout(function() { window.playNote(784, 0.25); }, 300);

      deactivateObstacles();

      showCollectionDialogue(fm.zone, 0);
      return true;
    }
  }

  // Check finale trigger
  if (W.state.fragments >= W.state.totalFragments && !W.state.finaleShown) {
    var distFromEnd = Math.sqrt(px * px + (pz - 28) * (pz - 28));
    if (distFromEnd < 8) {
      window.completeGame();
    } else {
      window.showNotification('✨ Return to the Summit for your reward', '#ffaa44');
    }
  }
};

// Dialogue system integration
var dialogueQueue = [];
var dialogueIndex = 0;
var dialogueActive = false;

function showZoneDialogue(zoneIdx, startIdx) {
  var zone = ZONES[zoneIdx];
  dialogueQueue = zone.dialogue.slice();
  dialogueIndex = 0;
  dialogueActive = true;
  W.state.dialogueActive = true;
  showNextDialogue();
}

function showCollectionDialogue(zoneIdx, startIdx) {
  var zone = ZONES[zoneIdx];
  dialogueQueue = zone.collectDialogue.slice();
  dialogueIndex = 0;
  dialogueActive = true;
  W.state.dialogueActive = true;
  showNextDialogue();
}

function showNextDialogue() {
  if (dialogueIndex >= dialogueQueue.length) {
    dialogueActive = false;
    W.state.dialogueActive = false;
    var box = document.getElementById('dialogueBox');
    box.classList.remove('show');
    return;
  }

  var msg = dialogueQueue[dialogueIndex];
  dialogueIndex++;
  var box = document.getElementById('dialogueBox');
  document.getElementById('dSpeaker').textContent = msg.speaker;
  typewriteText(msg.text);
  box.classList.add('show');
}

function typewriteText(text) {
  var el = document.getElementById('dText');
  el.innerHTML = '';
  var i = 0;

  function typeChar() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, 25 + Math.random() * 15);
    } else {
      var cursor = document.createElement('span');
      cursor.className = 'cursor';
      el.appendChild(cursor);
    }
  }
  typeChar();
}

window.advanceDialogue = function() {
  if (dialogueActive) {
    showNextDialogue();
  }
};

// Obstacle system
var obstacleTimers = {};

function activateObstacles(idx) {
  zoneObstaclesActive = true;
  window.showNotification('✦ ' + ZONES[idx].desc, '#ffaa44');
}

function deactivateObstacles() {
  zoneObstaclesActive = false;
  // Clean up obstacle meshes
  activeObstacles.forEach(function(o) {
    W.scene.remove(o.mesh);
    if (o.light) W.scene.remove(o.light);
  });
  activeObstacles = [];
}

// Simple audio
window.playNote = function(freq, dur) {
  if (!window._audioCtx) {
    try {
      window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { return; }
  }
  try {
    var ctx = window._audioCtx;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (dur || 0.2));
  } catch(e) {}
};

})();
