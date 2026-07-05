(function() {

var W = window.World;
var orb = null;
var trail = [];
var orbLight = null;

window.buildCompanion = function() {
  var scene = W.scene;

  orb = new THREE.Group();

  // Main sphere
  var coreMat = new THREE.MeshStandardMaterial({
    color: 0xffaa44,
    emissive: 0xffaa44,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    metalness: 0.1
  });
  var core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), coreMat);
  orb.add(core);

  // Inner glow
  var innerMat = new THREE.MeshBasicMaterial({
    color: 0xffeecc,
    transparent: true,
    opacity: 0.6
  });
  var inner = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), innerMat);
  orb.add(inner);

  // Outer glow ring
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  });
  var glowRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.35, 16), glowMat);
  glowRing.position.y = 0;
  glowRing.rotation.x = Math.PI / 2;
  orb.add(glowRing);

  var glowRing2 = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.35, 16), glowMat);
  glowRing2.position.y = 0;
  glowRing2.rotation.z = Math.PI / 2;
  orb.add(glowRing2);

  // Light
  orbLight = new THREE.PointLight(0xffaa44, 0.5, 5);
  orb.add(orbLight);

  orb.position.set(0, 1.5, -22);
  scene.add(orb);
};

window.updateCompanion = function(dt) {
  if (!orb) return;

  var px = W.playerPos.x;
  var py = W.playerPos.y;
  var pz = W.playerPos.z;

  // Target position: behind and above player
  var behind = new THREE.Vector3(0, 0, 1.5);
  behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), W.playerRot);

  var targetX = px + behind.x;
  var targetY = py + 2.0 + Math.sin(performance.now() * 0.001) * 0.2;
  var targetZ = pz + behind.z;

  // Smooth follow
  var speed = 3 * dt;
  orb.position.x += (targetX - orb.position.x) * speed;
  orb.position.y += (targetY - orb.position.y) * speed;
  orb.position.z += (targetZ - orb.position.z) * speed;

  // Keep above terrain
  if (typeof getHeight === 'function') {
    var th = getHeight(orb.position.x, orb.position.z);
    if (orb.position.y < th + 1.0) {
      orb.position.y = th + 1.0;
    }
  }

  // Rotation
  orb.rotation.y += dt * 0.5;
  orb.rotation.x = Math.sin(performance.now() * 0.002) * 0.1;

  // Pulse light
  if (orbLight) {
    orbLight.intensity = 0.3 + Math.sin(performance.now() * 0.004) * 0.2;
  }

  // Trail particles
  if (Math.random() < 0.3) {
    spawnTrailParticle();
  }

  // Update trail
  for (var i = trail.length - 1; i >= 0; i--) {
    var p = trail[i];
    p.alpha -= dt * 1.5;
    p.mesh.material.opacity = Math.max(0, p.alpha);
    p.mesh.scale.setScalar(p.alpha + 0.3);
    if (p.alpha <= 0) {
      W.scene.remove(p.mesh);
      trail.splice(i, 1);
    }
  }
};

function spawnTrailParticle() {
  var scene = W.scene;
  var size = 0.03 + Math.random() * 0.04;
  var mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.5
    })
  );
  mesh.position.copy(orb.position);
  mesh.position.x += (Math.random() - 0.5) * 0.3;
  mesh.position.y += (Math.random() - 0.5) * 0.3;
  mesh.position.z += (Math.random() - 0.5) * 0.3;
  scene.add(mesh);

  trail.push({
    mesh: mesh,
    alpha: 0.5 + Math.random() * 0.3
  });

  if (trail.length > 20) {
    var oldest = trail.shift();
    scene.remove(oldest.mesh);
  }
}

})();
