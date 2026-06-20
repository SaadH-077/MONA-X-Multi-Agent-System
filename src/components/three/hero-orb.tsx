"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useRef } from "react";
import * as THREE from "three";

/* A slow, glowing wireframe icosahedron that hovers/spins behind the MONA-X
   title. Subtle, premium, brand-coloured. */

function Shape() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.18;
      ref.current.rotation.x += dt * 0.06;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
      <group ref={ref}>
        <Icosahedron args={[1.6, 1]}>
          <meshBasicMaterial color="#2b7fff" wireframe transparent opacity={0.35} />
        </Icosahedron>
        <Icosahedron args={[1.15, 0]}>
          <meshStandardMaterial
            color="#0a0c24"
            emissive="#9b6cff"
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.6}
          />
        </Icosahedron>
      </group>
    </Float>
  );
}

export default function HeroOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={2} color="#2b7fff" />
        <pointLight position={[-4, -2, 2]} intensity={2} color="#ff6cc4" />
        <Shape />
        <EffectComposer>
          <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur radius={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
