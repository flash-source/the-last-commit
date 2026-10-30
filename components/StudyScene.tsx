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
}

export default function StudyScene({ activeCabinId, cabinData, onSelectCabin }: Props) {
  const totalSlots = COLS * ROWS;
  const cabins = Array.from({ length: totalSlots }, (_, i) => ({
    id: `cabin-${i}`,
    position: slotPosition(i),
  }));

  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows camera={{ position: [0, 26, 26], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0907"]} />
        <fog attach="fog" args={["#0a0907", 20, 60]} />

        <ambientLight intensity={0.12} color="#3b2d1f" />
        <directionalLight
          position={[8, 14, 6]}
          intensity={0.28}
          color="#7a6a4a"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Sparkles count={120} scale={40} size={1.6} speed={0.12} opacity={0.25} color="#ffd28a" />

        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[80, 60]} />
          <meshStandardMaterial color="#161310" roughness={0.95} />
        </mesh>

        {cabins.map((c) => (
          <Cabin
            key={c.id}
            id={c.id}
            position={c.position}
            active={activeCabinId === c.id}
            data={activeCabinId === c.id ? cabinData : null}
            onSelect={() => onSelectCabin(c.id)}
          />
        ))}

        <CameraRig activeCabinId={activeCabinId} cabins={cabins} />
        <AudioManager activeCabinId={activeCabinId} />
      </Canvas>
    </div>
  );
}