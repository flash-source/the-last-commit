"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, Sparkles } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

function Tombstone({
  position,
  label,
  repo,
  onInteract,
}: {
  position: [number, number, number];
  label: string;
  repo: string;
  onInteract: (repo: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={() => onInteract(repo)}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHover(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHover(false);
        }}
      >
        <boxGeometry args={[1.8, 2.2, 0.3]} />
        <meshStandardMaterial
          color={hovered ? "#3a0000" : "#1a1a1a"}
          emissive={hovered ? "#ff0000" : "#000000"}
          emissiveIntensity={hovered ? 0.6 : 0}
          roughness={0.7}
        />
        <Text
          position={[0, 0.2, 0.16]}
          fontSize={0.18}
          color={hovered ? "#ffcccc" : "#888888"}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </mesh>
    </Float>
  );
}

export default function GraveyardScene({
  onRepoSelect,
}: {
  onRepoSelect: (repo: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 2, 9], fov: 45 }}>
        <color attach="background" args={["#020205"]} />
        <fog attach="fog" args={["#020205", 3, 14]} />
        <ambientLight intensity={0.15} />
        <pointLight position={[5, 8, 5]} intensity={0.4} color="#4a00e0" />
        <pointLight position={[-5, 4, -5]} intensity={0.3} color="#8b0000" />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={150} scale={15} size={2} speed={0.3} opacity={0.4} color="#666666" />

        <Tombstone position={[-4.5, -0.4, 0]} label="Atom Editor" repo="atom/atom" onInteract={onRepoSelect} />
        <Tombstone position={[0, -0.4, -2]} label="Create React App" repo="facebook/create-react-app" onInteract={onRepoSelect} />
        <Tombstone position={[4.5, -0.4, 0.5]} label="Moment.js" repo="moment/moment" onInteract={onRepoSelect} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.1} />
        </mesh>
      </Canvas>
    </div>
  );
}