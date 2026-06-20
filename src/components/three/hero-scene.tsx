"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/* An interactive field of glowing particles that ripples under the cursor.
   Reads as "AI / data / a network of people" — not a solar system. */

const GRID = 58;
const SEP = 0.26;
const HALF = ((GRID - 1) * SEP) / 2;

/** Soft round sprite so each particle is a glowing dot, not a square. */
function useDotTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

function WaveField() {
  const ref = useRef<THREE.Points>(null);
  const tex = useDotTexture();

  const { positions, colors } = useMemo(() => {
    const count = GRID * GRID;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const navy = new THREE.Color("#16235e");
    const blue = new THREE.Color("#2b7fff");
    const purple = new THREE.Color("#9b6cff");
    const white = new THREE.Color("#e6ecff");

    let i = 0;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        positions[i * 3] = gx * SEP - HALF;
        positions[i * 3 + 1] = gy * SEP - HALF;
        positions[i * 3 + 2] = 0;

        const ny = gy / (GRID - 1);
        const col = new THREE.Color();
        if (ny < 0.5) col.copy(navy).lerp(blue, ny * 2);
        else col.copy(blue).lerp(purple, (ny - 0.5) * 2);
        if (Math.random() < 0.05) col.copy(white); // sparse highlights

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
        i++;
      }
    }
    return { positions, colors };
  }, []);

  useFrame((s) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = s.clock.elapsedTime;
    const mx = s.pointer.x * HALF;
    const my = s.pointer.y * HALF;

    for (let k = 0; k < arr.length; k += 3) {
      const x = arr[k];
      const y = arr[k + 1];
      let z = Math.sin(x * 0.55 + t) * 0.5 + Math.cos(y * 0.5 + t * 0.8) * 0.5;
      const dx = x - mx;
      const dy = y - my;
      z += Math.exp(-(dx * dx + dy * dy) * 0.28) * 1.7; // cursor swell
      arr[k + 2] = z;
    }
    attr.needsUpdate = true;
    pts.rotation.z = Math.sin(t * 0.04) * 0.06;
  });

  return (
    <points ref={ref} rotation={[-0.5, 0, 0]} position={[0, -0.3, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        map={tex}
        alphaMap={tex}
        vertexColors
        transparent
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* Big soft color washes behind the field — bloom turns these into ambience. */
function Glow({
  position,
  color,
  scale,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.14} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Suspense fallback={null}>
        <Glow position={[-3.5, 2.5, -5]} color="#2b7fff" scale={3.4} />
        <Glow position={[3.5, -2.5, -6]} color="#9b6cff" scale={4} />
        <WaveField />
        <EffectComposer>
          <Bloom
            intensity={1.0}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
