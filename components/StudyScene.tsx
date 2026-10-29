"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Sparkles } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

function Reliquary({
  position,
  label,
  color,
  onInteract,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  onInteract: (name: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => onInteract(label)}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHover(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHover(false);
        }}
      >
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[0, -0.95, 0.3]}
        fontSize={0.15}
        maxWidth={2}
        color={hovered ? "#ffffff" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

export default function StudyScene({
  repos,
  onInteract,
}: {
  repos: string[];
  onInteract: (repo: string) => void;
}) {
  const shownRepos =
    repos.length > 0 ? repos : ["Your-Project-1", "Your-Project-2", "Your-Project-3"];
  const colors = ["#4a90e2", "#50e3c2", "#f5a623"];

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }}>
        <color attach="background" args={["#0a0a0c"]} />
        <fog attach="fog" args={["#0a0a0c", 6, 18]} />

        <ambientLight intensity={0.35} />
        <pointLight position={[0, 3, 2]} intensity={1.5} color="#ffddaa" distance={8} decay={2} />
        <pointLight position={[-3, 2, -2]} intensity={0.5} color="#4a90e2" />
        <pointLight position={[3, 2, -2]} intensity={0.5} color="#f5a623" />

        <Sparkles count={80} scale={8} size={2} speed={0.2} opacity={0.3} color="#ffddaa" />

        {shownRepos.map((repo, i) => (
          <Reliquary
            key={repo}
            position={[(i - (shownRepos.length - 1) / 2) * 2.5, 0, 0]}
            label={repo}
            color={colors[i % colors.length]}
            onInteract={onInteract}
          />
        ))}

        <mesh position={[0, -1.25, 0]}>
          <boxGeometry args={[9, 0.3, 1.8]} />
          <meshStandardMaterial color="#2a1d14" roughness={0.8} />
        </mesh>

        <mesh position={[0, 1, -4]}>
          <planeGeometry args={[30, 12]} />
          <meshStandardMaterial color="#14100d" roughness={0.9} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0b0907" roughness={0.8} metalness={0.2} />
        </mesh>
      </Canvas>
    </div>
  );
}