(function() {

var W = window.World;

var player = {
  x: 0, y: 0, z: -25,
  vy: 0,
  rot: 0,
  height: 1.2,
  radius: 0.4,
  speed: 5,
  sprintMult: 1.8,
  jumpPower: 6,
  gravity: 16,
  grounded: false
};

var cam = {
  dist: 6,
  height: 2.5,
  smoothPos: new THREE.Vector3(),
  smoothLook: new THREE.Vector3(),
  yaw: 0,
  pitch: -0.15,
  targetYaw: 0,
  targetPitch: -0.15,
  sensitivity: 0.003,
  smoothing: 6
};

var characterGroup = null;
var animTime = 0;

window.updatePlayer = function(dt) {
  if (!W.state.started) return;

  var keys = W.keys;
  var yaw = cam.yaw;

  var fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  var speed = player.speed * (keys.sprint ? player.sprintMult : 1);
  var dx = 0, dz = 0;
  if (keys.fwd) { dx += fwd.x; dz += fwd.z; }
  if (keys.back) { dx -= fwd.x; dz -= fwd.z; }
  if (keys.left) { dx -= right.x; dz -= right.z; }
  if (keys.right) { dx += right.x; dz += right.z; }
  if (dx !== 0 && dz !== 0) { dx *= 0.707; dz *= 0.707; }

  var nx = player.x + dx * speed * dt;
  var nz = player.z + dz * speed * dt;

  if (typeof getHeight === 'function') {
    var h = getHeight(nx, nz);
    player.x = nx;
    player.z = nz;
    player.y = h;
  } else {
    player.x = nx;
    player.z = nz;
  }

  // Jump
  if (keys.jump && player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }

  var h = typeof getHeight === 'function' ? getHeight(player.x, player.z) : 0;
  player.vy -= player.gravity * dt;
  player.y += player.vy * dt;

  if (player.y <= h) {
    player.y = h;
    player.vy = 0;
    player.grounded = true;
  }

  // Rotation
  if (dx !== 0 || dz !== 0) {
    var targetRot = Math.atan2(dx, dz);
    var diff = targetRot - player.rot;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rot += diff * Math.min(1, 10 * dt);
  }

  W.playerPos.set(player.x, player.y, player.z);
  W.playerRot = player.rot;

  // Camera orbit with mouse
  cam.targetYaw += W.mouseDX * cam.sensitivity;
  cam.targetPitch += W.mouseDY * cam.sensitivity;
  cam.targetPitch = Math.max(-0.8, Math.min(0.4, cam.targetPitch));
  W.mouseDX = 0;
  W.mouseDY = 0;

  var smoothFactor = 1 - Math.exp(-cam.smoothing * dt);
  cam.yaw += (cam.targetYaw - cam.yaw) * smoothFactor;
  cam.pitch += (cam.targetPitch - cam.pitch) * smoothFactor;

  var camDist = cam.dist;
  if (keys.sprint) camDist = cam.dist + 1.5;
  var cx = player.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * camDist;
  var cy = player.y + cam.height + Math.sin(cam.pitch) * camDist + 0.5;
  var cz = player.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * camDist;

  // Camera collision with terrain
  if (typeof getHeight === 'function') {
    var terrainH = getHeight(cx, cz);
    if (cy - 0.3 < terrainH) {
      cy = terrainH + 0.3;
    }
  }

  W.camera.position.lerp(new THREE.Vector3(cx, cy, cz), smoothFactor);
  var lookTarget = new THREE.Vector3(player.x, player.y + 1.2, player.z);
  W.camera.lookAt(lookTarget);

  // Character body
  updateCharacter(dt, dx, dz);
};

function updateCharacter(dt, dx, dz) {
  var scene = W.scene;
  if (!characterGroup) {
    characterGroup = new THREE.Group();
    scene.add(characterGroup);
  }

  characterGroup.position.set(player.x, player.y, player.z);
  characterGroup.rotation.y = player.rot;

  var moving = dx !== 0 || dz !== 0;
  if (moving) animTime += dt * (W.keys.sprint ? 2.5 : 1.5);

  // Simple humanoid
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x4466aa, roughness: 0.6 });
  var skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
  var pantsMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7 });
  var shoeMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });

  if (characterGroup.children.length === 0) {
    // Body (torso)
    var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 8), bodyMat);
    torso.position.y = 0.75;
    torso.castShadow = true;
    characterGroup.add(torso);

    // Head
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skinMat);
    head.position.y = 1.05;
    head.castShadow = true;
    characterGroup.add(head);

    // Hair
    var hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 }));
    hair.position.y = 1.12;
    hair.scale.y = 0.4;
    characterGroup.add(hair);

    // Left arm
    var lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), skinMat);
    lArm.position.set(-0.32, 0.7, 0);
    lArm.rotation.z = 0.2;
    characterGroup.add(lArm);

    // Right arm
    var rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), skinMat);
    rArm.position.set(0.32, 0.7, 0);
    rArm.rotation.z = -0.2;
    characterGroup.add(rArm);

    // Legs (just simple cylinders)
    var lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 6), pantsMat);
    lLeg.position.set(-0.1, 0.32, 0);
    characterGroup.add(lLeg);

    var rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 6), pantsMat);
    rLeg.position.set(0.1, 0.32, 0);
    characterGroup.add(rLeg);

    // Shoes
    var lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), shoeMat);
    lShoe.position.set(-0.1, 0.13, 0.04);
    characterGroup.add(lShoe);

    var rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.14), shoeMat);
    rShoe.position.set(0.1, 0.13, 0.04);
    characterGroup.add(rShoe);

    // Shadow
    var shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    characterGroup.add(shadow);
  }

  // Animate legs when moving
  if (moving) {
    var swing = Math.sin(animTime * 2.5) * 0.2;
    characterGroup.children.forEach(function(child, idx) {
      if (idx === 5) child.position.x = -0.1 + swing;
      if (idx === 6) child.position.x = 0.1 - swing;
      if (idx === 7) child.position.x = -0.1 + swing;
      if (idx === 8) child.position.x = 0.1 - swing;
    });
  }
}

})();
