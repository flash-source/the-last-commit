"use client";

import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CabinData, Paper as PaperData } from "./StudyScene";

interface Props {
  id: string;
  position: [number, number, number];
  active: boolean;
  data: CabinData | null;
  onSelect: () => void;
  onOpenPaper: (index: number) => void;
}

const PAPER_COUNT = 3;
const PAPER_PITCH = 0.6;
const PAPER_W = 0.54;
const PAPER_H = 0.63;
const PAPER_Y = 0.845;
const PAPER_Z = -0.08;
const HTML_DISTANCE_FACTOR = 0.45;
const PX_PER_UNIT = 400 / HTML_DISTANCE_FACTOR;
const HOVER_RAISE = 0.07;
const SETTLE_DROP = 0.4;

function DeskPaper({
  index,
  paper,
  onOpen,
}: {
  index: number;
  paper: PaperData;
  onOpen: (index: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const x = (index - 1) * PAPER_PITCH;
  const tilt = index === 0 ? -2 : index === 2 ? 2 : 0;

  const startPos = useMemo(
    () => new THREE.Vector3(x, PAPER_Y + SETTLE_DROP, PAPER_Z),
    [x]
  );
  const flatQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
    []
  );

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const k = 1 - Math.pow(0.0005, Math.min(delta, 0.05));
    const targetY = PAPER_Y + (hovered ? HOVER_RAISE : 0);
    g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, k);
  });

  return (
    <>
      <mesh
        position={[x, PAPER_Y + 0.015, PAPER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(index);
        }}
      >
        <planeGeometry args={[PAPER_W, PAPER_H]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={groupRef} position={startPos} quaternion={flatQuat}>
        <Html
          transform
          center
          distanceFactor={HTML_DISTANCE_FACTOR}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              width: PAPER_W * PX_PER_UNIT,
              height: PAPER_H * PX_PER_UNIT,
              boxSizing: "border-box",
              padding: 24,
              overflow: "hidden",
              background: hovered ? "#f1e6cb" : "#e8dcc0",
              color: "#2a1f14",
              fontFamily: "Georgia, serif",
              fontSize: 20,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              border: hovered ? "2px solid #ffd28a" : "2px solid #8a7a5c",
              borderRadius: 8,
              boxShadow: hovered
                ? "0 0 40px rgba(255,200,120,0.45)"
                : "0 12px 40px rgba(0,0,0,0.7)",
              transform: `rotate(${tilt}deg)`,
              transition: "background 0.25s ease-out, border-color 0.25s ease-out, box-shadow 0.25s ease-out",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: 22,
                borderBottom: "2px solid #8a7a5c",
                marginBottom: 12,
                paddingBottom: 4,
                letterSpacing: 1,
              }}
            >
              {paper.title}
            </div>
            <div>{paper.body}</div>
          </div>
        </Html>
      </group>
    </>
  );
}

export default function Cabin({ id, position, active, data, onSelect, onOpenPaper }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

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
          <mesh>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color="#ffddaa"
              emissive="#ffaa55"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0, 0.15, 0]} intensity={1.5} color="#ffaa55" distance={4} />
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

      {active &&
        data &&
        Array.from({ length: PAPER_COUNT }).map((_, i) =>
          data.papers[i] ? (
            <DeskPaper
              key={`${data.repoName}-${i}`}
              index={i}
              paper={data.papers[i]}
              onOpen={onOpenPaper}
            />
          ) : null
        )}
    </group>
  );
}