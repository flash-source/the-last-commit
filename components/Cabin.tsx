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
  const [hoveredPaper, setHoveredPaper] = useState<number | null>(null);

  useFrame(({ clock }) => {
    if (!active) return;
    const light = groupRef.current?.getObjectByName("candle") as THREE.PointLight | undefined;
    if (light) {
      const t = clock.getElapsedTime();
      light.intensity = 1.5 + Math.sin(t * 6) * 0.2 + Math.sin(t * 11) * 0.05;
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
      </group>

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
            distance={6}
            castShadow
          />
        </group>
      )}

      {active && (
        <group position={[0.3, 0.85, 0.2]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color="#ffddaa"
              emissive="#ffaa55"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, 0.15, 0]}
            intensity={1.5}
            color="#ffaa55"
            distance={4}
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
        const isHovered = hoveredPaper === i;

        return (
          <group key={i}>
            {isVisible && (
              <mesh
                position={[(i - 1) * 0.6, 0.86, -0.08]}
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                  setHoveredPaper(i);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "auto";
                  setHoveredPaper(null);
                }}
              >
                <planeGeometry args={[0.6, 0.8]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            )}

            <Html
              position={isHovered ? [0, 1.5, 0.5] : [(i - 1) * 0.6, 0.85, -0.08]}
              rotation={isHovered ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
              transform
              distanceFactor={isHovered ? 5 : 2}
              style={{
                display: isVisible ? "block" : "none",
                pointerEvents: "none",
                transition: "opacity 0.2s ease-out",
              }}
            >
              <div
                style={{
                  width: 220,
                  background: "#e8dcc0",
                  color: "#2a1f14",
                  padding: 12,
                  fontFamily: "Georgia, serif",
                  fontSize: isHovered ? 14 : 10,
                  lineHeight: 1.4,
                  boxShadow: isHovered ? "0 12px 32px rgba(0,0,0,0.9)" : "0 6px 20px rgba(0,0,0,0.7)",
                  borderRadius: 4,
                  border: "1px solid #8a7a5c",
                  transform: `rotate(${isHovered ? 0 : i === 0 ? -2 : i === 2 ? 2 : 0}deg)`,
                  opacity: isVisible ? 1 : 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    borderBottom: "1px solid #8a7a5c",
                    marginBottom: 6,
                    paddingBottom: 2,
                    fontSize: isHovered ? 16 : 11,
                  }}
                >
                  {paper?.title ?? ""}
                </div>
                <div>{paper?.body ?? ""}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}