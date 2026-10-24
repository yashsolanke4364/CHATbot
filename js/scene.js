/* ============================================================
   scene.js — the 3D hero: an "AI core" with orbiting data nodes
   Three.js r128 (global THREE)
   ============================================================ */
(function () {
  var canvas = document.getElementById('scene');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 760;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, small ? 13.5 : 11.4);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var CYAN = 0x3ae0ff, VIOLET = 0x8b5cf6, MINT = 0x4ade80;

  /* ---------- the core ---------- */
  var core = new THREE.Group();
  scene.add(core);

  var shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 1),
    new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.55 })
  );
  core.add(shell);

  var inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 2),
    new THREE.MeshBasicMaterial({
      color: VIOLET, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    })
  );
  core.add(inner);

  var spark = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  core.add(spark);

  /* ---------- orbit rings ---------- */
  var rings = [];
  [[4.5, 0.004, 0x3ae0ff, 1.15, 0.2], [5.9, 0.003, 0x8b5cf6, -0.6, 1.1], [7.1, 0.002, 0x4ade80, 0.4, -0.9]]
    .forEach(function (r) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(r[0], r[1] + 0.012, 8, 160),
        new THREE.MeshBasicMaterial({ color: r[2], transparent: true, opacity: 0.22 })
      );
      ring.rotation.x = r[3];
      ring.rotation.y = r[4];
      scene.add(ring);
      rings.push(ring);
    });

  /* ---------- labelled data nodes ---------- */
  function labelSprite(text, color) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    var g = c.getContext('2d');
    g.font = '600 56px "Space Grotesk", Inter, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = color;
    g.shadowBlur = 26;
    g.fillStyle = '#ffffff';
    g.fillText(text, 256, 68);
    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.72, depthWrite: false
    }));
    sp.scale.set(2.1, 0.52, 1);
    return sp;
  }

  var LABELS = [
    { t: 'Attendance', c: '#3ae0ff', col: CYAN },
    { t: 'Results',    c: '#8b5cf6', col: VIOLET },
    { t: 'Fees',       c: '#4ade80', col: MINT },
    { t: 'Timetable',  c: '#3ae0ff', col: CYAN },
    { t: 'Library',    c: '#8b5cf6', col: VIOLET },
    { t: 'Faculty',    c: '#4ade80', col: MINT }
  ];

  var nodeGroup = new THREE.Group();
  nodeGroup.rotation.x = 0.22;
  scene.add(nodeGroup);

  var nodes = [];
  LABELS.forEach(function (L, i) {
    var a = (i / LABELS.length) * Math.PI * 2;
    var radius = small ? 4.6 : 5.35;
    var holder = new THREE.Group();
    holder.position.set(Math.cos(a) * radius, Math.sin(a * 2) * 1.35, Math.sin(a) * radius);

    var gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.21, 0),
      new THREE.MeshBasicMaterial({ color: L.col, transparent: true, opacity: 0.9 })
    );
    holder.add(gem);

    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshBasicMaterial({
        color: L.col, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending
      })
    );
    holder.add(halo);

    if (!small) {
      var label = labelSprite(L.t, L.c);
      label.position.set(0, 0.62, 0);
      holder.add(label);
    }

    nodeGroup.add(holder);
    nodes.push({ holder: holder, gem: gem, base: holder.position.clone(), phase: i * 1.1 });
  });

  /* ---------- links from core to each node ---------- */
  var linkPos = new Float32Array(nodes.length * 6);
  var linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  var links = new THREE.LineSegments(
    linkGeo,
    new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.18 })
  );
  nodeGroup.add(links);

  function updateLinks() {
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i].holder.position;
      linkPos[i * 6 + 0] = 0; linkPos[i * 6 + 1] = 0; linkPos[i * 6 + 2] = 0;
      linkPos[i * 6 + 3] = p.x; linkPos[i * 6 + 4] = p.y; linkPos[i * 6 + 5] = p.z;
    }
    linkGeo.attributes.position.needsUpdate = true;
  }

  /* ---------- starfield ---------- */
  var COUNT = small ? 450 : 1100;
  var starPos = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    var r = 7 + Math.random() * 14;
    var th = Math.random() * Math.PI * 2;
    var ph = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.cos(ph) * 0.55;
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0x9fd8ff, size: 0.055, transparent: true, opacity: 0.6, sizeAttenuation: true
  }));
  scene.add(stars);

  /* ---------- interaction ---------- */
  var mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------- loop ---------- */
  var clock = new THREE.Clock();
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) { clock.getDelta(); tick(); }
  });

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);

    var t = clock.getElapsedTime();
    var s = reduced ? 0.15 : 1;

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    core.rotation.y = t * 0.22 * s;
    core.rotation.x = Math.sin(t * 0.3) * 0.22 * s;
    shell.rotation.z = -t * 0.12 * s;
    inner.rotation.y = -t * 0.35 * s;

    var p = 1 + Math.sin(t * 2.1) * 0.08;
    spark.scale.set(p, p, p);
    spark.material.opacity = 0.65 + Math.sin(t * 2.1) * 0.2;

    nodeGroup.rotation.y = t * 0.085 * s;
    nodes.forEach(function (n, i) {
      n.holder.position.y = n.base.y + Math.sin(t * 1.1 + n.phase) * 0.22 * s;
      n.gem.rotation.x = t * (0.5 + i * 0.07) * s;
      n.gem.rotation.y = t * (0.7 + i * 0.05) * s;
    });
    updateLinks();

    rings[0].rotation.z = t * 0.09 * s;
    rings[1].rotation.z = -t * 0.07 * s;
    rings[2].rotation.z = t * 0.05 * s;

    stars.rotation.y = t * 0.016 * s;

    camera.position.x += (mouse.x * 1.15 - camera.position.x) * 0.045;
    camera.position.y += (-mouse.y * 0.75 - camera.position.y) * 0.045;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  updateLinks();
  tick();
})();
