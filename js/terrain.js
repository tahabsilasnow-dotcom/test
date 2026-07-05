(function() {

var W = window.World;

function height(x, z) {
  var h = 0;
  h += Math.sin(x * 0.05) * 1.2;
  h += Math.cos(z * 0.06) * 1.0;
  h += Math.sin((x + z) * 0.04) * 0.8;
  h += Math.cos((x * 0.5 - z * 0.3) * 0.08) * 0.6;
  h += Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.4;
  // Flatten areas around zones
  var z1 = -20, z2 = 5, z3 = 28;
  var zoneFlat = function(zx, zz, radius) {
    var d = Math.sqrt((x - zx) * (x - zx) + (z - zz) * (z - zz));
    if (d < radius) {
      var t = d / radius;
      return h * (t * t);
    }
    return h;
  };
  h = zoneFlat(0, z1, 6);
  h = zoneFlat(0, z2, 6);
  h = zoneFlat(0, z3, 6);
  return h;
}

window.getHeight = height;

window.buildTerrain = function() {
  var scene = W.scene;
  var size = 80;
  var segs = 80;
  var geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  var colors = new Float32Array(pos.count * 3);
  var minH = Infinity, maxH = -Infinity;

  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var h = height(x, z);
    pos.setY(i, h);
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }

  var range = maxH - minH || 1;
  for (var i = 0; i < pos.count; i++) {
    var y = pos.getY(i);
    var t = (y - minH) / range;
    var r, g, bl;
    if (t < 0.3) {
      var lt = t / 0.3;
      r = 0.2 + lt * 0.15;
      g = 0.25 + lt * 0.2;
      bl = 0.1 + lt * 0.08;
    } else if (t < 0.6) {
      var mt = (t - 0.3) / 0.3;
      r = 0.35 + mt * 0.2;
      g = 0.45 + mt * 0.15;
      bl = 0.18 + mt * 0.05;
    } else {
      var ht = (t - 0.6) / 0.4;
      r = 0.55 + ht * 0.25;
      g = 0.6 + ht * 0.15;
      bl = 0.23 + ht * 0.1;
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = bl;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  var mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: false
  });

  var mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  W._terrain = mesh;

  // Path between zones
  buildPath();

  // Decorate with trees, rocks, grass
  decorateTerrain();

  // Sky
  buildSky();

  // Distant mountains
  buildMountains();
};

function buildPath() {
  var scene = W.scene;
  var points = [
    { x: 0, z: -20 },
    { x: 1.5, z: -14 },
    { x: -1, z: -8 },
    { x: 0.5, z: -2 },
    { x: -0.5, z: 5 },
    { x: 1, z: 12 },
    { x: -0.5, z: 20 },
    { x: 0, z: 28 }
  ];

  for (var i = 0; i < points.length - 1; i++) {
    var p1 = points[i], p2 = points[i + 1];
    var dx = p2.x - p1.x, dz = p2.z - p1.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var steps = Math.ceil(dist / 0.3);
    for (var s = 0; s < steps; s++) {
      var t = s / steps;
      var px = p1.x + dx * t;
      var pz = p1.z + dz * t;
      var ph = height(px, pz) + 0.02;
      var stone = new THREE.Mesh(
        new THREE.CircleGeometry(0.15 + Math.random() * 0.1, 6),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 })
      );
      stone.rotation.x = -Math.PI / 2;
      stone.position.set(px, ph, pz);
      scene.add(stone);
    }
  }
}

function decorateTerrain() {
  var scene = W.scene;

  var treePositions = [];
  for (var i = 0; i < 120; i++) {
    var x = (Math.random() - 0.5) * 70;
    var z = (Math.random() - 0.5) * 70;
    var h = height(x, z);
    // Keep trees away from zone centers and paths
    var d1 = Math.sqrt(x * x + (z + 20) * (z + 20));
    var d2 = Math.sqrt(x * x + (z - 5) * (z - 5));
    var d3 = Math.sqrt(x * x + (z - 28) * (z - 28));
    if (d1 < 5 || d2 < 5 || d3 < 5) continue;
    if (h < 0.1 || h > 2.5) continue;
    treePositions.push({ x: x, z: z, h: h, scale: 0.6 + Math.random() * 0.8 });
  }

  treePositions.forEach(function(pos) {
    buildTree(pos.x, pos.h, pos.z, pos.scale);
  });

  for (var i = 0; i < 60; i++) {
    var x = (Math.random() - 0.5) * 65;
    var z = (Math.random() - 0.5) * 65;
    var h = height(x, z);
    if (h < 0 || h > 2) continue;
    var d1 = Math.sqrt(x * x + (z + 20) * (z + 20));
    var d2 = Math.sqrt(x * x + (z - 5) * (z - 5));
    var d3 = Math.sqrt(x * x + (z - 28) * (z - 28));
    if (d1 < 4 || d2 < 4 || d3 < 4) continue;
    var rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3),
      new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9 })
    );
    rock.position.set(x, h + 0.05, z);
    rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // Grass tufts (instanced)
  var grassMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.8 });
  var grassGeo = new THREE.ConeGeometry(0.06, 0.15, 4);
  var grassPositions = [];
  for (var i = 0; i < 300; i++) {
    var x = (Math.random() - 0.5) * 68;
    var z = (Math.random() - 0.5) * 68;
    var h = height(x, z);
    if (h < 0 || h > 1.8) continue;
    var d1 = Math.sqrt(x * x + (z + 20) * (z + 20));
    var d2 = Math.sqrt(x * x + (z - 5) * (z - 5));
    var d3 = Math.sqrt(x * x + (z - 28) * (z - 28));
    if (d1 < 4 || d2 < 4 || d3 < 4) continue;
    var blade = new THREE.Mesh(grassGeo.clone(), grassMat);
    blade.position.set(x, h, z);
    blade.rotation.set(Math.random() * 0.3 - 0.15, Math.random() * 6, Math.random() * 0.3 - 0.15);
    scene.add(blade);
  }
}

function buildTree(x, y, z, scale) {
  var scene = W.scene;
  var group = new THREE.Group();

  var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.9 });
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.6 * scale, 6), trunkMat);
  trunk.position.y = 0.3 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  var leafMat = new THREE.MeshStandardMaterial({ color: 0x2a6a3a, roughness: 0.7 });
  var colorVariants = [0x2a6a3a, 0x3a7a4a, 0x1a5a2a, 0x4a8a3a];
  var lc = colorVariants[Math.floor(Math.random() * colorVariants.length)];
  leafMat.color.setHex(lc);

  var leaf1 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 6, 6), leafMat);
  leaf1.position.set(0, 0.7 * scale, 0);
  leaf1.scale.y = 0.7;
  group.add(leaf1);

  var leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 6, 6), leafMat);
  leaf2.position.set(0.2 * scale, 0.9 * scale, 0.15 * scale);
  group.add(leaf2);

  var leaf3 = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 6, 6), leafMat);
  leaf3.position.set(-0.15 * scale, 0.85 * scale, -0.1 * scale);
  group.add(leaf3);

  group.position.set(x, y, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
}

function buildSky() {
  var scene = W.scene;
  var skyGeo = new THREE.SphereGeometry(120, 48, 48);
  var canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 256;
  var ctx = canvas.getContext('2d');
  var g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#0a0a2e');
  g.addColorStop(0.15, '#151040');
  g.addColorStop(0.3, '#2a1550');
  g.addColorStop(0.45, '#3a1a4a');
  g.addColorStop(0.6, '#4a2040');
  g.addColorStop(0.75, '#3a1a30');
  g.addColorStop(0.85, '#2a1020');
  g.addColorStop(1, '#1a0a1a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256);
  // Stars
  for (var i = 0; i < 80; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.08 + 0.02) + ')';
    ctx.beginPath();
    ctx.arc(Math.random() * 1, Math.random() * 180, Math.random() * 0.006 + 0.001, 0, Math.PI * 2);
    ctx.fill();
  }
  var tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));

  // Moon
  var moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffeecc, emissive: 0xffddaa, emissiveIntensity: 0.12, roughness: 0.2 })
  );
  moon.position.set(25, 30, -40);
  scene.add(moon);

  var moonGlow = new THREE.PointLight(0xffeedd, 0.3, 50);
  moonGlow.position.copy(moon.position);
  scene.add(moonGlow);
}

function buildMountains() {
  var scene = W.scene;
  var mat = new THREE.MeshStandardMaterial({ color: 0x2a2040, roughness: 0.9, flatShading: true });
  for (var i = 0; i < 8; i++) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(4 + Math.random() * 6, 3 + Math.random() * 5, 6), mat);
    var angle = Math.random() * Math.PI * 2;
    var dist = 35 + Math.random() * 10;
    m.position.set(Math.cos(angle) * dist, height(Math.cos(angle) * dist, Math.sin(angle) * dist) - 1, Math.sin(angle) * dist);
    m.rotation.y = Math.random() * 6;
    scene.add(m);
  }
}

})();
