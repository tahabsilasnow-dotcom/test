/* ============================================================
   🍉 WATERMELON MUSEUM — Game Engine
   ============================================================ */

// ======================== NVIDIA AI ========================
window.NVIDIA = {
  key: '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',
  chatUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
  model: 'meta/llama-3.3-70b-instruct'
};

// ======================== CONFIG ========================
window.CFG = {
  health: 100, moveSpeed: 3.5, sprintMult: 1.6, height: 1.6, radius: 0.3,
  pistolDmg: 25, shotgunDmg: 14, shotgunPellets: 5, shotgunAmmo: 15,
  mouseSens: 0.0018, mouseSmooth: 9
};

// ======================== ROOM DEFINITIONS ========================
window.ROOMS = [
  { id:'welcome', name:'🌅 Welcome Hall', x:3, z:0, desc:'Begin your journey',
    floor:0x4a3050, wall:0x5a4060, ceil:0x2a1030, ambient:0x774499,
    hemi:[0xffddbb,0x774499,0.7], lights:[{color:0xffaa66,pos:[3,4,0],int:1.2},{color:0xcc88ff,pos:[1,3,1],int:0.8},{color:0xcc88ff,pos:[5,3,-1],int:0.8}] },
  { id:'gallery', name:'🖼️ Golden Gallery', x:10, z:0, desc:'Find the hidden golden key',
    floor:0x5a3a20, wall:0x6a4a30, ceil:0x3a1a0a, ambient:0x775533,
    hemi:[0xffeebb,0x775533,0.8], lights:[{color:0xffcc88,pos:[10,4,0],int:1.5},{color:0xffaa44,pos:[8,3,1],int:0.7},{color:0xffaa44,pos:[12,3,-1],int:0.7}] },
  { id:'garden', name:'🌺 Moonlit Garden', x:17, z:0, desc:'Collect 5 glowing moonflowers',
    floor:0x1a4a3a, wall:0x2a5a4a, ceil:0x0a2a1a, ambient:0x338866,
    hemi:[0x88ffcc,0x338866,0.8], lights:[{color:0x66ffaa,pos:[17,4,0],int:1.0},{color:0x44dd88,pos:[15,3,1],int:0.6},{color:0x44dd88,pos:[19,3,-1],int:0.6}] },
  { id:'library', name:'📚 Forgotten Library', x:24, z:0, desc:'Memorize the light sequence',
    floor:0x3a2010, wall:0x4a3020, ceil:0x1a0a05, ambient:0x553322,
    hemi:[0xffbb77,0x553322,0.5], lights:[{color:0xff8844,pos:[24,4,0],int:1.0},{color:0xffaa55,pos:[22,3,1],int:0.6},{color:0xcc7733,pos:[26,3,-1],int:0.5}] },
  { id:'basement', name:'💀 Shadow Basement', x:24, z:-10, desc:'Survive the monster ambush',
    floor:0x1a0808, wall:0x2a1010, ceil:0x0a0404, ambient:0x331111,
    hemi:[0x883333,0x331111,0.5], lights:[{color:0xff2222,pos:[24,3,-10],int:0.6},{color:0xcc1111,pos:[22,2,-8],int:0.4},{color:0xaa0000,pos:[26,2,-12],int:0.4}] },
  { id:'crystal', name:'💎 Crystal Cavern', x:17, z:-10, desc:'Dodge falling crystals 15s',
    floor:0x1a1a4a, wall:0x2a2a5a, ceil:0x0a0a3a, ambient:0x4466aa,
    hemi:[0xaabbff,0x4466aa,0.8], lights:[{color:0x8888ff,pos:[17,5,-10],int:1.2},{color:0x6666ff,pos:[15,3,-8],int:0.7},{color:0xaaaaff,pos:[19,4,-12],int:0.7}] },
  { id:'music', name:'🎵 Harmonic Hall', x:10, z:-10, desc:'Click in rhythm with the beat',
    floor:0x3a1a4a, wall:0x4a2a5a, ceil:0x1a0a2a, ambient:0x773388,
    hemi:[0xff88ee,0x773388,0.8], lights:[{color:0xff66dd,pos:[10,4,-10],int:1.2},{color:0xcc44bb,pos:[8,3,-8],int:0.7},{color:0xff88ff,pos:[12,3,-12],int:0.7}] },
  { id:'rooftop', name:'⚡ Storm Rooftop', x:3, z:-10, desc:'Defeat the final boss!',
    floor:0x1a1a3e, wall:0x2a2a4e, ceil:0x0a0a2e, ambient:0x4444aa,
    hemi:[0x8888ff,0x4444aa,0.6], lights:[{color:0x6666ff,pos:[3,5,-10],int:1.0},{color:0xaaaaff,pos:[1,4,-8],int:0.7},{color:0x4444ff,pos:[5,6,-12],int:0.8}] }
];

// ======================== STATE ========================
window.S = {
  health: CFG.health, weapon:'pistol', hasShotgun:false, ammo:Infinity,
  currentRoom:0, roomsDone:[false,false,false,false,false,false,false,false],
  entered:false, gameOver:false,
  monstersKilled:0, keyCollected:false, bossAlive:false, bossHealth:150,
  finaleShown:false,
  monsters:[], bullets:[], orbs:[], dodgeObstacles:[], particles:[],
  audioCtx:null, roomAmbience:null, oracleCooldown:0,
  oracleCrystal:null, oracleLight:null,
  targetYaw:0, targetPitch:0,
  shakeTimer:0, shakeOffset:{x:0,y:0}
};

// ======================== ROOM GAMES REGISTRY ========================
window.roomGames = {};

// ======================== THREE.JS ========================
let scene, camera, renderer, clock;
window.player = {x:3, y:1.6, z:0};
let yaw = 0, pitch = 0;
const pitchLimit = Math.PI / 2.3;
const input = {fwd:false, back:false, left:false, right:false, sprint:false};
let pointerLocked = false;
const wallBoxes = [];

// ======================== INIT ========================
window.initEngine = function() {
  const container = document.getElementById('game-container');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(player.x, CFG.height, player.z);
  renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);
  clock = new THREE.Clock();
  camera.rotation.order = 'YXZ';

  buildSky();
  buildAllRooms();

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setupPointerLock();
  setupInput();
  setupInteraction();
  initAudio();
  animate();
};

// ======================== SKY ========================
function buildSky() {
  const skyGeo = new THREE.SphereGeometry(80, 32, 32);
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#0a0a2e'); g.addColorStop(0.2,'#1a1040');
  g.addColorStop(0.4,'#3a1a3a'); g.addColorStop(0.55,'#6a2030');
  g.addColorStop(0.7,'#8a3020'); g.addColorStop(0.85,'#b05030');
  g.addColorStop(1,'#e08040');
  ctx.fillStyle = g; ctx.fillRect(0,0,1,256);
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({map:tex, side:THREE.BackSide})));

  // Stars
  const sc = 1500, g2 = new THREE.BufferGeometry(), p = new Float32Array(sc*3);
  for (let i=0; i<sc; i++) {
    const theta = Math.random()*Math.PI*2, phi = Math.acos(Math.random()*0.6+0.2), r = 70+Math.random()*10;
    p[i*3]=r*Math.sin(phi)*Math.cos(theta); p[i*3+1]=r*Math.cos(phi); p[i*3+2]=r*Math.sin(phi)*Math.sin(theta);
  }
  g2.setAttribute('position', new THREE.BufferAttribute(p,3));
  scene.add(new THREE.Points(g2, new THREE.PointsMaterial({color:0xffffff,size:0.08,transparent:true,opacity:0.7,sizeAttenuation:true})));

  // Moon
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5,24,24), new THREE.MeshStandardMaterial({color:0xffeedd,emissive:0xffddaa,emissiveIntensity:0.1,roughness:0.3}));
  moon.position.set(20,25,-30); scene.add(moon);
  const moonGlow = new THREE.PointLight(0xffeedd,0.2,40); moonGlow.position.copy(moon.position); scene.add(moonGlow);
}

// ======================== ROOM BUILDER ========================
function buildAllRooms() {
  const wallMat = new THREE.MeshStandardMaterial({roughness:0.7,metalness:0.1});

  ROOMS.forEach((r, idx) => {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(7,7), new THREE.MeshStandardMaterial({color:r.floor,roughness:0.8,metalness:0.05}));
    m.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2)); m.position.set(r.x,0,r.z); scene.add(m);

    const wm = wallMat.clone(); wm.color.setHex(r.wall);
    const skipLeft = ROOMS.some(o=>o!==r&&Math.abs(o.x-(r.x-7))<0.1&&Math.abs(o.z-r.z)<0.1);
    const skipRight = ROOMS.some(o=>o!==r&&Math.abs(o.x-(r.x+7))<0.1&&Math.abs(o.z-r.z)<0.1);
    const skipBack = ROOMS.some(o=>o!==r&&Math.abs(o.z-(r.z-7))<0.1&&Math.abs(o.x-r.x)<0.1);
    const skipFront = ROOMS.some(o=>o!==r&&Math.abs(o.z-(r.z+7))<0.1&&Math.abs(o.x-r.x)<0.1);
    if (!skipBack) addWallBox(7,4,0.2,r.x,2,r.z-3.5,wm);
    if (!skipFront) addWallBox(7,4,0.2,r.x,2,r.z+3.5,wm);
    if (!skipLeft) addWallBox(0.2,4,7,r.x-3.5,2,r.z,wm);
    if (!skipRight) addWallBox(0.2,4,7,r.x+3.5,2,r.z,wm);
    (()=>{const cm=new THREE.Mesh(new THREE.BoxGeometry(7,0.1,7),new THREE.MeshStandardMaterial({visible:false}));cm.position.set(r.x,4,r.z);scene.add(cm);})();

    scene.add(new THREE.AmbientLight(r.ambient,0.6));
    scene.add(new THREE.HemisphereLight(r.hemi[0],r.hemi[1],r.hemi[2]));
    r.lights.forEach(l=>{const pl=new THREE.PointLight(l.color,l.int,12);pl.position.set(l.pos[0],l.pos[1],l.pos[2]);pl.castShadow=true;scene.add(pl);});
  });

  // Connector floors between adjacent rooms on same row
  for (let i=0;i<ROOMS.length;i++) for (let j=i+1;j<ROOMS.length;j++) {
    const a=ROOMS[i],b=ROOMS[j];
    if (Math.abs(a.z-b.z)>0.1) continue;
    const dist=Math.abs(b.x-a.x);
    if (dist<6.9||dist>8) continue;
    const conn=new THREE.Mesh(new THREE.PlaneGeometry(dist-6,2),new THREE.MeshStandardMaterial({color:0x3a3050,roughness:0.8}));
    conn.rotation.x=-Math.PI/2; conn.position.set((a.x+b.x)/2,0.01,a.z); scene.add(conn);
  }

  // Stair corridor from room 3 (24,0) to room 4 (24,-10)
  for (let z=-0.5;z>=-9.5;z-=0.8) {
    const h=0.02+(Math.abs(z+0.5)/10)*0.2;
    const step=new THREE.Mesh(new THREE.BoxGeometry(2.2,h,0.9),new THREE.MeshStandardMaterial({color:0x3a1020,roughness:0.5}));
    step.position.set(24,h/2,z); scene.add(step);
  }
  const sf=new THREE.Mesh(new THREE.PlaneGeometry(2.5,11),new THREE.MeshStandardMaterial({color:0x1a0a1e,roughness:0.9}));
  sf.rotation.x=-Math.PI/2; sf.position.set(24,-0.05,-5); scene.add(sf);
  addWallBox(0.2,4,11,22.8,2,-5,new THREE.MeshStandardMaterial({color:0x2a1040,roughness:0.8}));
  addWallBox(0.2,4,11,25.2,2,-5,new THREE.MeshStandardMaterial({color:0x2a1040,roughness:0.8}));
  addWallBox(2.5,4,0.2,24,2,-10.5,new THREE.MeshStandardMaterial({color:0x2a1040,roughness:0.8}));

  // Room decorations
  for (let i=0;i<ROOMS.length;i++) buildRoomDecor(ROOMS[i],i);
}

window.addWallBox = function(w,h,d,x,y,z,mat) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; scene.add(m);
  wallBoxes.push(new THREE.Box3(new THREE.Vector3(x-w/2,0,z-d/2),new THREE.Vector3(x+w/2,h,z+d/2)));
  return m;
};

function buildRoomDecor(r, idx) {
  if (window.roomGames[idx] && window.roomGames[idx].build) {
    window.roomGames[idx].build(r, idx);
  }
}

// ======================== HIT MARKER ========================
function showHitMarker() {
  const el = document.createElement('div');
  el.textContent = '✚';
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;color:red;font-weight:bold;pointer-events:none;z-index:999;text-shadow:0 0 5px rgba(255,0,0,0.5);opacity:0.9;';
  document.body.appendChild(el);
  setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 200);
}

// ======================== PLAYER ========================
function updatePlayer(dt) {
  if (!S.entered||S.gameOver||!pointerLocked) return;
  const speed = input.sprint ? CFG.moveSpeed*1.4 : CFG.moveSpeed;
  const fwd=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const right=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  let dx=0,dz=0;
  if (input.fwd){dx+=fwd.x*speed*dt;dz+=fwd.z*speed*dt;}
  if (input.back){dx-=fwd.x*speed*dt;dz-=fwd.z*speed*dt;}
  if (input.left){dx-=right.x*speed*dt;dz-=right.z*speed*dt;}
  if (input.right){dx+=right.x*speed*dt;dz+=right.z*speed*dt;}
  if (dx!==0&&dz!==0){dx*=0.707;dz*=0.707;}
  const nx=player.x+dx,nz=player.z+dz;
  const box=new THREE.Box3(new THREE.Vector3(nx-CFG.radius,0,nz-CFG.radius),new THREE.Vector3(nx+CFG.radius,2,nz+CFG.radius));
  let blocked=false;
  for (const w of wallBoxes) if (box.intersectsBox(w)){blocked=true;break;}
  if (!blocked){player.x=nx;player.z=nz;}
  player.y = CFG.height;
  camera.position.set(player.x, CFG.height, player.z);
  // Screen shake
  if(S.shakeTimer > 0) {
    S.shakeTimer -= dt;
    camera.position.x += S.shakeOffset.x;
    camera.position.y += S.shakeOffset.y;
    if(S.shakeTimer <= 0) { S.shakeOffset.x = 0; S.shakeOffset.y = 0; }
  }
  // Smooth camera toward target using frame-rate-independent lerp
  const smoothFactor = 1 - Math.exp(-CFG.mouseSmooth * dt);
  yaw += (S.targetYaw - yaw) * smoothFactor;
  pitch += (S.targetPitch - pitch) * smoothFactor;
  camera.rotation.set(pitch, yaw, 0);
  if (S.entered) updateCurrentRoom();
  checkInteractions();
  if (window.roomGames[S.currentRoom]&&window.roomGames[S.currentRoom].update) {
    window.roomGames[S.currentRoom].update(dt);
  }
}

function updateCurrentRoom() {
  for (let i=0;i<ROOMS.length;i++) {
    const r=ROOMS[i];
    if (Math.abs(player.x-r.x)<3.2&&Math.abs(player.z-r.z)<3.2) {
      if (S.currentRoom!==i) {
        S.currentRoom=i;
        document.getElementById('roomName').textContent=r.name;
        showNotification(`📍 ${r.name}`,'#8a4bff');
        playRoomAmbience(i);
        showRoomGame(i);
        if (window.roomGames[i]&&window.roomGames[i].enter) window.roomGames[i].enter(i);
      }
      break;
    }
  }
}

// ======================== POINTER LOCK & MOUSE ========================
function setupPointerLock() {
  document.addEventListener('pointerlockchange',()=>{
    pointerLocked=document.pointerLockElement!==null;
    document.getElementById('pointerLockHint').style.display=(!pointerLocked&&S.entered)?'flex':'none';
    document.getElementById('crosshair').style.opacity=pointerLocked?'1':'0';
  });
  document.addEventListener('click',()=>{
    if(!pointerLocked&&S.entered&&!S.gameOver)document.body.requestPointerLock();
  });
  // Store raw mouse delta — smoothed in the render loop
  document.addEventListener('mousemove',e=>{
    if(!pointerLocked)return;
    S.targetYaw -= e.movementX * CFG.mouseSens;
    S.targetPitch -= e.movementY * CFG.mouseSens;
    S.targetPitch = Math.max(-pitchLimit, Math.min(pitchLimit, S.targetPitch));
  });
}

function setupInput() {
  document.addEventListener('keydown',e=>{
    if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')input.fwd=true;
    if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')input.back=true;
    if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')input.left=true;
    if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')input.right=true;
    if(e.key==='Shift')input.sprint=true;
  });
  document.addEventListener('keyup',e=>{
    if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')input.fwd=false;
    if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')input.back=false;
    if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')input.left=false;
    if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')input.right=false;
    if(e.key==='Shift')input.sprint=false;
  });
  document.addEventListener('mousedown',e=>{if(e.button===0&&pointerLocked)shoot();});
}

// ======================== WEAPONS ========================
function shoot() {
  if(!pointerLocked||S.gameOver||!S.entered)return;
  if(S.weapon==='shotgun'&&S.ammo<=0)return;
  const pellets=S.weapon==='shotgun'?CFG.shotgunPellets:1;
  const dmg=S.weapon==='shotgun'?CFG.shotgunDmg:CFG.pistolDmg;
  if(S.weapon==='shotgun')S.ammo--;
  updateHUD();

  // Let room game handle click — returns true ONLY if it consumed the click
  if(window.roomGames[S.currentRoom]&&window.roomGames[S.currentRoom].click){
    const consumed = window.roomGames[S.currentRoom].click();
    if(consumed === true) return;
  }

  // Muzzle flash
  const flash=new THREE.PointLight(0xffaa66,2,4);
  flash.position.set(camera.position.x+Math.sin(yaw)*0.5,camera.position.y-0.2,camera.position.z+Math.cos(yaw)*0.5);
  scene.add(flash); setTimeout(()=>scene.remove(flash),80);

  // Screen shake
  S.shakeTimer = 0.1;
  S.shakeOffset.x = (Math.random() - 0.5) * 0.05;
  S.shakeOffset.y = (Math.random() - 0.5) * 0.05;

  for(let p=0;p<pellets;p++){
    const spread=S.weapon==='shotgun'?0.05:0.003;
    const ray=new THREE.Raycaster();
    const dir=new THREE.Vector3(0,0,-1)
      .applyAxisAngle(new THREE.Vector3(1,0,0),pitch+(Math.random()-0.5)*spread*2)
      .applyAxisAngle(new THREE.Vector3(0,1,0),yaw+(Math.random()-0.5)*spread*2);
    ray.set(camera.position,dir);
    for(const m of S.monsters){
      if(!m.alive) continue;
      const dist=camera.position.distanceTo(m.mesh.position);
      if(dist>15) continue;
      if(ray.ray.distanceToPoint(m.mesh.position)<(m.isBoss?1:0.5)){damageMonster(m,dmg);break;}
    }
  }
  pitch-=0.02;
}

window.damageMonster = function(m,dmg) {
  if(!m.alive)return;
  showHitMarker();
  m.health-=dmg;m.hitFlash=0.15;m.mesh.material.color.setHex(0xffffff);
  // Recoil: stop and move backward
  const dx = m.x - player.x, dz = m.z - player.z;
  const recoilDist = Math.hypot(dx, dz);
  if(recoilDist > 0.1) { m.recoilDir = {x: dx/recoilDist, z: dz/recoilDist}; }
  else { m.recoilDir = {x: 0, z: 0}; }
  m.recoilTimer = 0.2;
  // Boss stage check
  if(m.isBoss && m.health <= 75 && m.health > 0 && !m.stage2) {
    m.stage2 = true;
    m.speed *= 2;
  }
  if(m.health<=0){
    m.alive=false;scene.remove(m.mesh);
    if(m.isBoss && m.glowLight) { scene.remove(m.glowLight); m.glowLight = null; }
    const colors = [0xff4444,0xff6b7d,0xffaa44,0xffcc44,0xff8844,0xff6622];
    for(let i=0;i<15;i++){
      const color=colors[Math.floor(Math.random()*colors.length)];
      const p=new THREE.Mesh(new THREE.SphereGeometry(0.04,4,4),new THREE.MeshBasicMaterial({color}));
      p.position.copy(m.mesh.position);p.position.x+=(Math.random()-0.5)*0.5;p.position.z+=(Math.random()-0.5)*0.5;p.position.y=0.5+Math.random()*0.5;
      scene.add(p);S.particles.push({mesh:p,vel:{x:(Math.random()-0.5)*3,y:2+Math.random()*2,z:(Math.random()-0.5)*3},life:1});
    }
    if(m.isBoss){S.bossAlive=false;document.getElementById('bossBar').style.display='none';completeRoomGame(7);}
    else{S.monstersKilled++;updateHUD();}
  }
};

// ======================== MONSTERS ========================
window.spawnMonster = function(x,z,isBoss) {
  const m={x,z,health:isBoss?150:30,speed:0.8+Math.random()*0.4,alive:true,isBoss:isBoss||false,attackCD:0,hitFlash:0,mesh:null,
    strafeOffset:Math.random()*Math.PI*2,moveDelay:Math.random()*1.0,recoilTimer:0,recoilDir:{x:0,z:0},chargeTimer:isBoss?0:0,charging:0,stage2:false,glowLight:null};
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=isBoss?'#4a0000':'#1a0000';ctx.fillRect(0,0,96,96);
  ctx.fillStyle=isBoss?'#cc0000':'#660022';ctx.beginPath();ctx.arc(48,40,22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(40,35,4,0,Math.PI*2);ctx.arc(56,35,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(48,46,7,0,Math.PI);ctx.fill();
  ctx.strokeStyle='#880000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(28,52);ctx.lineTo(68,52);ctx.stroke();
  ctx.fillStyle='#440000';ctx.beginPath();ctx.moveTo(38,25);ctx.lineTo(32,10);ctx.lineTo(44,22);ctx.fill();
  ctx.beginPath();ctx.moveTo(58,25);ctx.lineTo(64,10);ctx.lineTo(52,22);ctx.fill();
  if(isBoss){ctx.fillStyle='#ff4444';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('👑',48,20);}
  const tex=new THREE.CanvasTexture(canvas);tex.needsUpdate=true;
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true,depthWrite:false});
  const sprite=new THREE.Sprite(mat);sprite.scale.set(isBoss?2:1,isBoss?2:1,1);
  sprite.position.set(x,isBoss?1.6:1,z);scene.add(sprite);
  m.mesh=sprite;S.monsters.push(m);
  if(isBoss){
    S.bossAlive=true;S.bossHealth=150;document.getElementById('bossBar').style.display='flex';
    m.glowLight=new THREE.PointLight(0xff2222,0.8,5);m.glowLight.position.set(x,1.6,z);scene.add(m.glowLight);
  }
  return m;
};

// ======================== INTERACTION ========================
function setupInteraction() {
  document.addEventListener('keydown',e=>{
    if(e.key==='e'||e.key==='E'||e.key===' '){e.preventDefault();tryInteract();}
    if(e.key==='q'||e.key==='Q')switchWeapon();
  });
}

function tryInteract() {
  if(S.gameOver||!S.entered)return;
  // Delegate to room game
  if(window.roomGames[S.currentRoom]&&window.roomGames[S.currentRoom].interact){
    if(window.roomGames[S.currentRoom].interact()) return;
  }
  // Oracle
  if(S.oracleCrystal&&Math.hypot(player.x-S.oracleCrystal.position.x,player.z-S.oracleCrystal.position.z)<2){
    document.getElementById('oracleOverlay').classList.remove('hidden');
    if(document.pointerLockElement)document.exitPointerLock();
  }
}

function checkInteractions() {
  let show=false;
  // Oracle
  if(S.oracleCrystal&&Math.hypot(player.x-S.oracleCrystal.position.x,player.z-S.oracleCrystal.position.z)<2)show=true;
  const el=document.getElementById('interactPrompt');
  if(show){el.classList.add('show');el.innerHTML='🔮 Press <b>E</b> to ask the Oracle';}
  else el.classList.remove('show');
}

function switchWeapon() {
  if(!S.hasShotgun)return;
  S.weapon=S.weapon==='pistol'?'shotgun':'pistol';updateHUD();
}

// ======================== ORACLE CRYSTAL ========================
window.addOracleCrystal = function() {
  const g=new THREE.Group();
  const m=new THREE.MeshStandardMaterial({color:0x8a4bff,emissive:0x8a4bff,emissiveIntensity:0.5,transparent:true,opacity:0.8,roughness:0.1,metalness:0.3});
  const c=new THREE.Mesh(new THREE.OctahedronGeometry(0.3,0),m);c.position.y=0.4;g.add(c);
  const cm=new THREE.MeshStandardMaterial({color:0xff6bcd,emissive:0xff6bcd,emissiveIntensity:0.6});
  const co=new THREE.Mesh(new THREE.IcosahedronGeometry(0.12,0),cm);co.position.y=0.4;g.add(co);
  const pm=new THREE.MeshStandardMaterial({color:0x444466,roughness:0.3,metalness:0.5});
  const p=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,0.25,12),pm);p.position.y=0.12;g.add(p);
  g.position.set(6.5,0,3.5);scene.add(g);S.oracleCrystal=g;
  S.oracleLight=new THREE.PointLight(0x8a4bff,0.5,4);S.oracleLight.position.set(6.5,0.8,3.5);scene.add(S.oracleLight);
};

// ======================== AUDIO ========================
function initAudio() {try{S.audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}

window.playNote = function(freq,dur,type) {
  if(!S.audioCtx)return;
  try{const o=S.audioCtx.createOscillator(),g=S.audioCtx.createGain();o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(0.08,S.audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,S.audioCtx.currentTime+dur);
  o.connect(g);g.connect(S.audioCtx.destination);o.start();o.stop(S.audioCtx.currentTime+dur);}catch(e){}
};

window.playRoomAmbience = function(idx) {
  if(S.roomAmbience){try{S.roomAmbience.gain.gain.exponentialRampToValueAtTime(0.001,S.audioCtx.currentTime+0.3);}catch(e){}}
  if(!S.audioCtx)return;
  try{const freqs=[80,100,120,90,70,110,130,60],types=['sine','triangle','sine','sawtooth','square','sine','triangle','sine'],gains=[0.03,0.02,0.025,0.035,0.03,0.02,0.025,0.04];
  const o=S.audioCtx.createOscillator(),g=S.audioCtx.createGain();o.type=types[idx%types.length];o.frequency.value=freqs[idx%freqs.length];
  g.gain.setValueAtTime(gains[idx%gains.length],S.audioCtx.currentTime);o.connect(g);g.connect(S.audioCtx.destination);o.start();S.roomAmbience={osc:o,gain:g};}catch(e){}
};

window.playFinaleMusic = function() {
  if(!S.audioCtx)return;
  [392,440,523,587,659,784,880,1047].forEach((n,i)=>setTimeout(()=>playNote(n,0.3,'sine'),i*200));
};

// ======================== AI ORACLE ========================
window.askOracle = async function() {
  if(S.oracleCooldown>0)return;
  const btn=document.getElementById('oracleAskBtn'),status=document.getElementById('oracleStatus'),chat=document.getElementById('oracleChat');
  btn.disabled=true;status.textContent='🔮 Thinking...';
  const typing=document.createElement('div');typing.className='msg typing oracle-msg';
  typing.innerHTML='Ora is consulting the spirits <span>.</span><span>.</span><span>.</span>';
  chat.appendChild(typing);chat.scrollTop=chat.scrollHeight;
  const r=ROOMS[S.currentRoom];
  try{
    const res=await fetch(NVIDIA.chatUrl,{method:'POST',headers:{'Authorization':`Bearer ${NVIDIA.key}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:NVIDIA.model,messages:[{role:'system',content:'You are Ora the Watermelon Spirit in a birthday game for Houda. Warm, funny, uses watermelon puns, 1-3 sentence hints.'},{role:'user',content:`Houda is in "${r.name}" (room ${S.currentRoom}, done:${S.roomsDone[S.currentRoom]}). Hint?`}],max_tokens:150,temperature:0.85})});
    if(!res.ok)throw Error('fail');
    const d=await res.json(),text=d.choices?.[0]?.message?.content||'✨ Silent...';
    chat.removeChild(typing);const msg=document.createElement('div');msg.className='msg oracle-msg';msg.textContent='🔮 '+text;chat.appendChild(msg);status.textContent='✨ Ready';
  }catch(e){
    chat.removeChild(typing);const fb=['🍉 Follow the light, Houda!','✨ Look around carefully!','🔮 Trust your instincts!','🌸 You\'ve got this!','🍉 Keep growing through each room!'];
    const msg=document.createElement('div');msg.className='msg oracle-msg';msg.textContent=fb[Math.floor(Math.random()*fb.length)];chat.appendChild(msg);status.textContent='✨ The magic flows';
  }
  chat.scrollTop=chat.scrollHeight;btn.disabled=false;S.oracleCooldown=5;setTimeout(()=>{S.oracleCooldown=0;},5000);
};

// ======================== UI ========================
window.showNotification = function(text,color) {
  const el=document.getElementById('notif');el.textContent=text;el.style.borderColor=color||'#ffc94d';el.classList.add('show');
  clearTimeout(el._timeout);el._timeout=setTimeout(()=>el.classList.remove('show'),2500);
};

window.updateHUD = function() {
  document.getElementById('hpText').textContent=Math.max(0,Math.round(S.health));
  document.getElementById('hpFill').style.width=Math.max(0,(S.health/CFG.health)*100)+'%';
  document.getElementById('weapDisplay').textContent=S.weapon==='shotgun'?'🔫 Shotgun':'🔫 Pistol';
  document.getElementById('ammoDisplay').textContent=S.weapon==='shotgun'?`🔸 ${S.ammo}`:'∞';
};

window.showRoomGame = function(idx) {
  const hud=document.getElementById('minigameHud'),timer=document.getElementById('mgTimer'),obj=document.getElementById('mgObjective'),prog=document.getElementById('mgProgress');
  if(S.roomsDone[idx]){hud.style.display='none';return;}
  hud.style.display='flex';obj.textContent=ROOMS[idx].desc;prog.innerHTML='';
  if(window.roomGames[idx]&&window.roomGames[idx].hud)window.roomGames[idx].hud(timer,prog);
  else{timer.textContent='✨';prog.innerHTML='<span style="opacity:0.5">Explore!</span>';}
};

window.completeRoomGame = function(idx) {
  S.roomsDone[idx]=true;
  const emojis=['🌅','🖼️','🌺','📚','💀','💎','🎵','⚡'],names=['Welcome!','Key Found!','Garden Saved!','Memory Master!','Survivor!','Crystal Clear!','Perfect Rhythm!','Boss Defeated!'],
    descs=['The museum awakens...','The golden key is yours!','Moonflowers glow!','Library remembers!','Shadows flee!','Crystals stop!','Hall applauds!','HAPPY BIRTHDAY!'];
  const rc=document.getElementById('roomComplete');
  document.getElementById('rcEmoji').textContent=emojis[idx];document.getElementById('rcLabel').textContent=names[idx];document.getElementById('rcDesc').textContent=descs[idx];
  rc.classList.add('show');setTimeout(()=>rc.classList.remove('show'),2200);
  playNote(523,0.15,'sine');setTimeout(()=>playNote(659,0.15,'sine'),150);setTimeout(()=>playNote(784,0.25,'sine'),300);
  document.getElementById('minigameHud').style.display='none';
  showNotification(`✅ ${names[idx]}`,'#44ff88');
  if(S.roomsDone.every(d=>d))setTimeout(()=>{document.getElementById('finaleOverlay').classList.remove('hidden');document.exitPointerLock();S.finaleShown=true;launchConfetti();playFinaleMusic();},1000);
};

window.gameOver = function() {
  S.gameOver=true;document.getElementById('gameOverOverlay').classList.remove('hidden');document.exitPointerLock();
};

window.launchConfetti = function() {
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;z-index:9;pointer-events:none';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d'),pieces=[],colors=['#ff6b7d','#ffc94d','#44ff88','#88ddff','#c9a6e0','#ffffff'];
  for(let i=0;i<120;i++)pieces.push({x:Math.random()*canvas.width,y:-20-Math.random()*300,w:4+Math.random()*6,h:2+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)],vy:2+Math.random()*3,vx:(Math.random()-0.5)*2,rot:Math.random()*360});
  let frame=0;
  function draw(){frame++;ctx.clearRect(0,0,canvas.width,canvas.height);let alive=false;
    for(const p of pieces){p.y+=p.vy;p.x+=p.vx;p.rot+=p.vy*2;if(p.y<canvas.height+20)alive=true;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
    if(alive&&frame<400)requestAnimationFrame(draw);else document.body.removeChild(canvas);}
  draw();
};

// ======================== ANIMATE ========================
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  updatePlayer(dt);

  S.monsters.forEach(m=>{
    if(!m.alive||S.gameOver)return;

    // Staggered start delay
    if(m.moveDelay > 0) {
      m.moveDelay -= dt;
      // Still update hitFlash and attackCD during delay
      if(m.hitFlash>0){m.hitFlash-=dt;m.mesh.material.color.setHex(m.hitFlash>0?0xffffff:(m.isBoss?0x4a0000:0x1a0000));}
      if(m.attackCD>0)m.attackCD-=dt;
      if(m.isBoss&&m.glowLight){const ps=(m.stage2||m.health<=75)?8:3;m.glowLight.intensity=0.5+Math.sin(performance.now()*0.001*ps)*0.5;}
      return;
    }

    // Recoil: move backward, skip normal pursuit
    if(m.recoilTimer > 0) {
      m.recoilTimer -= dt;
      m.x += m.recoilDir.x * m.speed * dt * 2;
      m.z += m.recoilDir.z * m.speed * dt * 2;
      const rr=ROOMS[S.currentRoom];
      if(Math.abs(m.x-rr.x)>2.5)m.x=rr.x+Math.sign(m.x-rr.x)*2.5;
      if(Math.abs(m.z-rr.z)>2.5)m.z=rr.z+Math.sign(m.z-rr.z)*2.5;
      m.mesh.position.set(m.x,m.isBoss?1.6:1,m.z);
      if(m.hitFlash>0){m.hitFlash-=dt;m.mesh.material.color.setHex(m.hitFlash>0?0xffffff:(m.isBoss?0x4a0000:0x1a0000));}
      if(m.attackCD>0)m.attackCD-=dt;
      if(m.isBoss&&m.glowLight){const ps=(m.stage2||m.health<=75)?8:3;m.glowLight.intensity=0.5+Math.sin(performance.now()*0.001*ps)*0.5;}
      return;
    }

    const dx=player.x-m.x,dz=player.z-m.z,dist=Math.hypot(dx,dz);

    // Boss charge
    let currentSpeed = m.speed;
    if(m.isBoss) {
      m.chargeTimer -= dt;
      if(m.chargeTimer <= 0) {
        m.chargeTimer = 3;
        m.charging = 0.5;
      }
      if(m.charging > 0) {
        m.charging -= dt;
        currentSpeed = m.speed * 3;
      }
    }

    if(dist>0.3){
      if(m.isBoss) {
        m.x += (dx/dist)*currentSpeed*dt;
        m.z += (dz/dist)*currentSpeed*dt;
      } else {
        // Strafing movement
        const strafe = Math.cos(m.strafeOffset + performance.now() * 0.002) * 0.3;
        m.x += (dx/dist)*m.speed*dt + (-dz/dist)*m.speed*strafe*dt;
        m.z += (dz/dist)*m.speed*dt + (dx/dist)*m.speed*strafe*dt;
      }
    }

    const r=ROOMS[S.currentRoom];
    if(Math.abs(m.x-r.x)>2.5)m.x=r.x+Math.sign(m.x-r.x)*2.5;
    if(Math.abs(m.z-r.z)>2.5)m.z=r.z+Math.sign(m.z-r.z)*2.5;
    m.mesh.position.set(m.x,m.isBoss?1.6:1,m.z);

    if(m.hitFlash>0){m.hitFlash-=dt;m.mesh.material.color.setHex(m.hitFlash>0?0xffffff:(m.isBoss?0x4a0000:0x1a0000));}

    if(dist<1.2&&m.attackCD<=0){
      S.health-=m.isBoss?15:10;
      m.attackCD=m.isBoss?((m.stage2||m.health<=75)?0.5:1):1;
      updateHUD();if(S.health<=0)gameOver();
    }
    if(m.attackCD>0)m.attackCD-=dt;

    // Boss glow pulse — faster when low HP
    if(m.isBoss&&m.glowLight){
      const ps=(m.stage2||m.health<=75)?8:3;
      m.glowLight.intensity=0.5+Math.sin(performance.now()*0.001*ps)*0.5;
    }
  });

  for(let i=S.bullets.length-1;i>=0;i--){
    const p=S.bullets[i];if(p.type!=='particle')continue;
    p.mesh.position.x+=p.vel.x*dt;p.mesh.position.y+=p.vel.y*dt;p.mesh.position.z+=p.vel.z*dt;
    p.vel.y-=5*dt;p.life-=dt;if(p.life<=0){scene.remove(p.mesh);S.bullets.splice(i,1);}
  }

  for(let i=S.particles.length-1;i>=0;i--){
    const p=S.particles[i];
    p.mesh.position.x+=p.vel.x*dt;p.mesh.position.y+=p.vel.y*dt;p.mesh.position.z+=p.vel.z*dt;
    p.vel.y-=5*dt;p.life-=dt;if(p.life<=0){scene.remove(p.mesh);S.particles.splice(i,1);}
  }

  if(S.oracleCrystal){S.oracleCrystal.rotation.y+=dt*0.5;if(S.oracleLight)S.oracleLight.intensity=0.5+Math.sin(performance.now()*0.003)*0.25;}

  // Welcome room hint
  if(S.currentRoom===0&&!S.roomsDone[0]&&!document.getElementById('interactPrompt').classList.contains('show')){
    document.getElementById('interactPrompt').innerHTML='🌅 Press <b>E</b> to begin';
    document.getElementById('interactPrompt').classList.add('show');
  }

  renderer.render(scene,camera);
}

window.getScene = ()=>scene;
window.getCamera = ()=>camera;
window.getWallBoxes = ()=>wallBoxes;
window.getYaw = ()=>yaw;
window.getPitch = ()=>pitch;
