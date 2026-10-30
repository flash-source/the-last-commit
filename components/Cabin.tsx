"use client";

import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CabinData } from "./StudyScene";

interface Props {
  id: string;
  position: [number, number, number];
  active: boolean;
  data: CabinData | null;
  onSelect: () => void;
}

const PAPER_COUNT = 3;

export default function Cabin({ id, position, active, data, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!active) return;
    const light = groupRef.current?.getObjectByName("candle") as THREE.PointLight | undefined;
    if (light) {
      const t = clock.getElapsedTime();
      light.intensity = 1.6 + Math.sin(t * 6) * 0.18 + Math.sin(t * 11) * 0.06;
    }
  });

  const baseColor = active ? "#1a130c" : hovered ? "#17120c" : "#0f0b08";

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        setHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        setHovered(false);
      }}
    >
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.0, 0.06, 2.4]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>

      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#3a2618" roughness={0.85} />
      </mesh>
      {([[-0.95, 0.4, -0.45], [0.95, 0.4, -0.45], [-0.95, 0.4, 0.45], [0.95, 0.4, 0.45]] as const).map(
        (p, i) => (
          <mesh key={i} position={p} castShadow>
            <boxGeometry args={[0.08, 0.76, 0.08]} />
            <meshStandardMaterial color="#2a1a10" />
          </mesh>
        )
      )}

      <group position={[0, 0, 1.15]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.7, 0.06, 0.7]} />
          <meshStandardMaterial color="#241608" />
        </mesh>
        <mesh position={[0, 0.75, -0.32]} castShadow>
          <boxGeometry args={[0.7, 0.6, 0.06]} />
          <meshStandardMaterial color="#241608" />
        </mesh>
        {([[-0.3, 0.21, -0.3], [0.3, 0.21, -0.3], [-0.3, 0.21, 0.3], [0.3, 0.21, 0.3]] as const).map(
          (p, i) => (
            <mesh key={i} position={p}>
              <boxGeometry args={[0.05, 0.42, 0.05]} />
              <meshStandardMaterial color="#1a1008" />
            </mesh>
          )
        )}
      </group>

      <mesh position={[-1.1, 1.2, -0.6]}>
        <torusKnotGeometry args={[0.12, 0.02, 40, 4]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.4} />
      </mesh>

      {active && (
        <group position={[-0.85, 0.9, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.15, 12]} />
            <meshStandardMaterial color="#f2e6c4" emissive="#ffb84d" emissiveIntensity={0.4} />
          </mesh>
          <pointLight
            name="candle"
            position={[0, 0.25, 0]}
            intensity={1.4}
            color="#ffb066"
            distance={5}
            castShadow
          />
        </group>
      )}

      <Html position={[0, 1.02, -0.66]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
        <div
          style={{
            color: active ? "#ffd28a" : hovered ? "#8a7a5c" : "#5a4a30",
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: 1.5,
            whiteSpace: "nowrap",
            textShadow: active ? "0 0 8px rgba(255,180,80,0.5)" : "none",
          }}
        >
          {active && data ? data.repoName : id.replace("cabin-", "· ")}
        </div>
      </Html>

      {Array.from({ length: PAPER_COUNT }).map((_, i) => {
        const paper = data?.papers?.[i];
        const isVisible = active && !!paper;

        return (
          <Html
            key={i}
            position={[-0.6 + i * 0.6, 0.85 + i * 0.004, -0.08 + i * 0.006]}
            rotation={[-Math.PI / 2, 0, 0]}
            transform
            distanceFactor={2.0}
            style={{
              width: 220,
              pointerEvents: "none",
              display: isVisible ? "block" : "none",
            }}
          >
            <div
              style={{
                background: "#e8dcc0",
                color: "#2a1f14",
                padding: 10,
                fontFamily: "Georgia, serif",
                fontSize: 10,
                lineHeight: 1.35,
                boxShadow: "0 6px 20px rgba(0,0,0,0.7)",
                transform: `rotate(${i % 2 === 0 ? -1.5 : 1.2}deg)`,
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                maxHeight: 260,
                opacity: isVisible ? 1 : 0, // Double safety
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: "1px solid #8a7a5c",
                  marginBottom: 4,
                  letterSpacing: 1,
                  fontSize: 9,
                }}
              >
                {paper?.title ?? ""}
              </div>
              <div>{paper?.body ?? ""}</div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}