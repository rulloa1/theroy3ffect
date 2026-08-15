import { useEffect, useRef } from "react";

/**
 * Three.js WebGL particle + energy-line field with bloom post-processing.
 * Everything is imported dynamically inside the effect so it never runs on the server.
 */
export function ParticleBackground() {
  const holder = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import(
        "three/examples/jsm/postprocessing/UnrealBloomPass.js"
      );

      const mount = holder.current;
      if (!mount || disposed) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
      camera.position.z = 60;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      /* ---------------- particles ---------------- */
      const COUNT = 15000;
      const positions = new Float32Array(COUNT * 3);
      const basePositions = new Float32Array(COUNT * 3);
      const velocities = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const base = new THREE.Color(0x001f3f);
      const acid = new THREE.Color(0xccff00);

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * 220;
        const y = (Math.random() - 0.5) * 140;
        const z = (Math.random() - 0.5) * 160;
        positions[i3] = basePositions[i3] = x;
        positions[i3 + 1] = basePositions[i3 + 1] = y;
        positions[i3 + 2] = basePositions[i3 + 2] = z;
        colors[i3] = base.r;
        colors[i3 + 1] = base.g;
        colors[i3 + 2] = base.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      /* ---------------- energy lines ---------------- */
      const LINES = 530;
      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array(LINES * 6);
      const speeds = new Float32Array(LINES);
      for (let i = 0; i < LINES; i++) {
        const i6 = i * 6;
        const x = (Math.random() - 0.5) * 240;
        const y = (Math.random() - 0.5) * 160;
        const z = -Math.random() * 400;
        const len = 6 + Math.random() * 22;
        linePos[i6] = x;
        linePos[i6 + 1] = y;
        linePos[i6 + 2] = z;
        linePos[i6 + 3] = x;
        linePos[i6 + 4] = y;
        linePos[i6 + 5] = z + len;
        speeds[i] = 0.6 + Math.random() * 1.8;
      }
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.2,
        dashSize: 3,
        gapSize: 2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      lines.computeLineDistances();
      scene.add(lines);

      /* ---------------- post processing ---------------- */
      const composer = new EffectComposer(renderer);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(width, height);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.8, 0.1, 1.0);
      composer.addPass(bloom);

      /* ---------------- pointer interaction ---------------- */
      const pointer = new THREE.Vector2(10, 10);
      const raycaster = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3(9999, 9999, 9999);
      const tmp = new THREE.Vector3();

      const onMove = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(plane, hit);
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      const posAttr = geometry.getAttribute("position");
      const colAttr = geometry.getAttribute("color");
      const linesAttr = lineGeo.getAttribute("position");

      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);

        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          const px = positions[i3]!;
          const py = positions[i3 + 1]!;
          const pz = positions[i3 + 2]!;
          tmp.set(px, py, pz);
          const dx = tmp.x - hit.x;
          const dy = tmp.y - hit.y;
          const dz = tmp.z - hit.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          let mix = 0;
          let vx = velocities[i3]!;
          let vy = velocities[i3 + 1]!;
          let vz = velocities[i3 + 2]!;

          if (dist < 20) {
            const force = (1 - dist / 20) * 0.04;
            vx += dx * force;
            vy += dy * force;
            vz += dz * force;
            mix = (1 - dist / 20) * 0.4;
          }

          // spring back home
          vx = (vx + (basePositions[i3]! - px) * 0.01) * 0.9;
          vy = (vy + (basePositions[i3 + 1]! - py) * 0.01) * 0.9;
          vz = (vz + (basePositions[i3 + 2]! - pz) * 0.01) * 0.9;

          velocities[i3] = vx;
          velocities[i3 + 1] = vy;
          velocities[i3 + 2] = vz;

          positions[i3] = px + vx;
          positions[i3 + 1] = py + vy;
          positions[i3 + 2] = pz + vz;

          const cr = colors[i3]!;
          const cg = colors[i3 + 1]!;
          const cb = colors[i3 + 2]!;
          colors[i3] = cr + (base.r + (acid.r - base.r) * mix - cr) * 0.15;
          colors[i3 + 1] = cg + (base.g + (acid.g - base.g) * mix - cg) * 0.15;
          colors[i3 + 2] = cb + (base.b + (acid.b - base.b) * mix - cb) * 0.15;
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        for (let i = 0; i < LINES; i++) {
          const i6 = i * 6;
          const s = speeds[i]!;
          let z1 = linePos[i6 + 2]! + s;
          let z2 = linePos[i6 + 5]! + s;
          if (z1 > 80) {
            z1 -= 480;
            z2 -= 480;
          }
          linePos[i6 + 2] = z1;
          linePos[i6 + 5] = z2;
        }
        linesAttr.needsUpdate = true;


        points.rotation.y += 0.0004;
        composer.render();
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        lineGeo.dispose();
        lineMat.dispose();
        bloom.dispose();
        composer.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={holder}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
}
