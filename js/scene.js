import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Draws a tag's monogram/name/tagline onto an offscreen canvas — same
// approach as before, just called directly instead of through a React hook.
// When a tag has a real logo, the ring+monogram badge is skipped entirely
// (the logo itself, added separately as a big 3D plane, takes that space)
// and the name/tagline move down to a small strip near the bottom instead
// of the middle, so the logo can dominate the card.
function makeLabelTexture(tag) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 820;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;

  if (!tag.logo) {
    const badgeY = 190;
    const initial = (tag.name || "?").trim().charAt(0).toUpperCase();
    ctx.beginPath();
    ctx.arc(cx, badgeY, 92, 0, Math.PI * 2);
    ctx.strokeStyle = tag.accent || "#E8B84B";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = "#f4f0e6";
    ctx.font = "700 130px 'Space Grotesk', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, cx, badgeY + 8);

    ctx.font = "700 58px 'Space Grotesk', Arial, sans-serif";
    ctx.fillStyle = "#f4f0e6";
    wrapText(ctx, tag.name || "", cx, 400, 420, 66);

    if (tag.tagline) {
      ctx.font = "400 30px Arial, sans-serif";
      ctx.fillStyle = tag.accent || "#E8B84B";
      wrapText(ctx, tag.tagline, cx, 560, 420, 40);
    }
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 46px 'Space Grotesk', Arial, sans-serif";
    ctx.fillStyle = "#f4f0e6";
    wrapText(ctx, tag.name || "", cx, 700, 440, 54);

    if (tag.tagline) {
      ctx.font = "400 26px Arial, sans-serif";
      ctx.fillStyle = tag.accent || "#E8B84B";
      wrapText(ctx, tag.tagline, cx, 760, 440, 34);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

// One floating tag: metallic card mesh + label + optional real logo image
// (loaded manually with an onError that just skips it — never throws, so a
// bad/missing logo path can't take the whole scene down).
class Tag3D {
  constructor(tag, index, total, onClick) {
    this.tag = tag;
    this.index = index;
    this.onClick = onClick;
    this.hovered = false;
    this.orbitRadius = 2.2 + Math.max(0, total - 3) * 0.35;
    this.orbitAngle = (index / total) * Math.PI * 2;
    this.orbitSpeed = 0.18;
    this.target = { z: 0, scale: 1, emissive: 0.15 };

    this.group = new THREE.Group();

    const geo = new RoundedBoxGeometry(1.5, 2.4, 0.08, 6, 0.12);
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tag.baseColor || "#8a8d92"),
      metalness: tag.metalness ?? 0.85,
      roughness: tag.roughness ?? 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(tag.accent || "#E8B84B"),
      emissiveIntensity: 0.15,
      reflectivity: 1,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);

    const labelTex = makeLabelTexture(tag);
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 2.16),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, toneMapped: false })
    );
    labelPlane.position.set(0, 0, 0.046);
    this.group.add(labelPlane);

    const seam = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.04),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tag.accent || "#E8B84B"), toneMapped: false })
    );
    seam.position.set(0, -1.05, 0.045);
    this.group.add(seam);

    if (tag.logo) {
      new THREE.TextureLoader().load(
        tag.logo,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          // size the logo to fill most of the card, preserving its real
          // aspect ratio (so a wide logo doesn't get squished) instead of
          // a small fixed-size circle — this is the card's main visual now
          const maxW = 1.2, maxH = 1.3;
          const imgAspect = (tex.image.width || 1) / (tex.image.height || 1);
          let w = maxW, h = maxW / imgAspect;
          if (h > maxH) { h = maxH; w = maxH * imgAspect; }
          const logoPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })
          );
          logoPlane.position.set(0, 0.35, 0.05);
          this.group.add(logoPlane);
        },
        undefined,
        () => { /* logo failed to load — silently keep the plain badge */ }
      );
    }

    this.group.userData.tagInstance = this;
  }

  update(elapsed, delta) {
    const angle = this.orbitAngle + elapsed * this.orbitSpeed;
    const baseX = Math.cos(angle) * this.orbitRadius;
    const baseY = Math.sin(elapsed * 0.5 + this.index) * 0.25;
    const baseZ = Math.sin(angle) * this.orbitRadius;

    this.mesh.rotation.y += delta * 0.25;
    this.mesh.rotation.x = Math.sin(elapsed * 0.3 + this.index) * 0.08;

    const active = this.hovered || this.isActive;
    this.target.z = active ? 2.6 : 0;
    this.target.scale = active ? 1.35 : 1;
    this.target.emissive = active ? 0.9 : 0.15;
    const pull = active ? 0.55 : 0;

    this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, baseX * (1 - pull), 0.08);
    this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, baseY, 0.08);
    this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, baseZ + this.target.z, 0.08);

    const s = THREE.MathUtils.lerp(this.group.scale.x, this.target.scale, 0.1);
    this.group.scale.set(s, s, s);

    this.mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
      this.mesh.material.emissiveIntensity, this.target.emissive, 0.1
    );
  }
}

export function createTagScene(container, tags) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
  const startPos = new THREE.Vector3(-4.5, 2.4, 12);
  const restPos = new THREE.Vector3(0, 0.4, 7.5);
  camera.position.copy(startPos);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const spot = new THREE.SpotLight(0xffffff, 2, 0, 0.35, 1);
  spot.position.set(6, 8, 6);
  scene.add(spot);
  const p1 = new THREE.PointLight(0xE8B84B, 1.2);
  p1.position.set(-6, -3, -4);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xE8B84B, 0.6);
  p2.position.set(4, -2, 3);
  scene.add(p2);

  const instances = tags.map((tag, i) => {
    const t = new Tag3D(tag, i, tags.length, null);
    scene.add(t.group);
    return t;
  });

  // pointer interaction
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredInstance = null;

  function updatePointer(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onContainerPointerMove(e) {
    updatePointer(e.clientX, e.clientY);
    raycaster.setFromCamera(pointer, camera);
    const meshes = instances.map((t) => t.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    const hit = hits[0]?.object.parent.userData.tagInstance ?? null;
    if (hit !== hoveredInstance) {
      if (hoveredInstance) hoveredInstance.hovered = false;
      hoveredInstance = hit;
      if (hoveredInstance) hoveredInstance.hovered = true;
      container.style.cursor = hoveredInstance ? "pointer" : "auto";
    }
  }
  container.addEventListener("pointermove", onContainerPointerMove);

  function onContainerClick() {
    if (hoveredInstance) {
      const tag = hoveredInstance.tag;
      window.dispatchEvent(new CustomEvent("tag-selected", { detail: tag }));
      if (tag.url && tag.url !== "#") window.open(tag.url, "_blank", "noopener");
    }
  }
  container.addEventListener("click", onContainerClick);

  const clock = new THREE.Clock();
  const drift = new THREE.Vector2();
  const mouseNdc = new THREE.Vector2();
  function onWindowPointerMove(e) {
    mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener("pointermove", onWindowPointerMove);

  let settled = false;
  let rafId = null;
  let disposed = false;

  function animate() {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    if (!settled) {
      const t = Math.min(elapsed / 3.2, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos, restPos, eased);
      camera.lookAt(0, 0, 0);
      if (t >= 1) settled = true;
    } else {
      drift.x = THREE.MathUtils.lerp(drift.x, mouseNdc.x * 0.35, 0.04);
      drift.y = THREE.MathUtils.lerp(drift.y, mouseNdc.y * 0.2, 0.04);
      camera.position.x = restPos.x + drift.x;
      camera.position.y = restPos.y + drift.y;
      camera.lookAt(0, 0, 0);
    }

    instances.forEach((t) => t.update(elapsed, delta));
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", onResize);

  return {
    setActive(id) {
      instances.forEach((t) => { t.isActive = t.tag.id === id; });
    },
    // Called before replacing this scene with a fresh one (e.g. tags
    // changed) — stops the render loop and event listeners so they don't
    // keep running in the background or duplicate on the next scene.
    destroy() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointermove", onContainerPointerMove);
      container.removeEventListener("click", onContainerClick);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}
