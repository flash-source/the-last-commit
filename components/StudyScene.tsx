"use client";

import { Canvas } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import Cabin from "./Cabin";
import CameraRig from "./CameraRig";
import AudioManager from "./AudioManager";

export type Paper = { title: string; body: string };
export type CabinData = { id: string; repoName: string; papers: Paper[] };

const COLS = 6;
const ROWS = 4;
const SPACING = 4;

export function slotPosition(slot: number): [number, number, number] {
  const r = Math.floor(slot / COLS);
  const c = slot % COLS;
  return [
    (c - (COLS - 1) / 2) * SPACING,
    0,
    (r - (ROWS - 1) / 2) * SPACING,
  ];
}

export function randomSlot(): number {
  return Math.floor(Math.random() * COLS * ROWS);
}

interface Props {
  activeCabinId: string | null;
  cabinData: CabinData | null;
  onSelectCabin: (id: string) => void;
  onOpenPaper: (index: number) => void;
}

export default function StudyScene({ activeCabinId, cabinData, onSelectCabin, onOpenPaper }: Props) {
  const totalSlots = COLS * ROWS;
  const cabins = Array.from({ length: totalSlots }, (_, i) => ({
    id: `cabin-${i}`,
    position: slotPosition(i),
  }));

  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows camera={{ position: [0, 18, 22], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={["#050403"]} />
        <fog attach="fog" args={["#050403", 10, 45]} />

        <ambientLight intensity={0.08} color="#3b2d1f" />
        <directionalLight
          position={[-10, 12, 5]}
          intensity={0.15}
          color="#7a8a9a"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Sparkles count={300} scale={[40, 15, 40]} size={2} speed={0.1} opacity={0.4} color="#ffd28a" position={[0, 10, 0]} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#14100c" roughness={0.95} />
        </mesh>

        <mesh position={[0, 10, -18]} receiveShadow>
          <boxGeometry args={[50, 20, 1]} />
          <meshStandardMaterial color="#1a1612" roughness={1} />
        </mesh>

        <mesh position={[-18, 10, 0]} receiveShadow>
          <boxGeometry args={[1, 20, 50]} />
          <meshStandardMaterial color="#1a1612" roughness={1} />
        </mesh>

        <mesh position={[18, 10, 0]} receiveShadow>
          <boxGeometry args={[1, 20, 50]} />
          <meshStandardMaterial color="#1a1612" roughness={1} />
        </mesh>

        <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#0f0c09" />
        </mesh>

        {cabins.map((c) => (
          <Cabin
            key={c.id}
            id={c.id}
            position={c.position}
            active={activeCabinId === c.id}
            data={activeCabinId === c.id ? cabinData : null}
            onSelect={() => onSelectCabin(c.id)}
            onOpenPaper={onOpenPaper}
          />
        ))}

        <CameraRig activeCabinId={activeCabinId} cabins={cabins} />
        <AudioManager activeCabinId={activeCabinId} />
      </Canvas>
    </div>
  );
}