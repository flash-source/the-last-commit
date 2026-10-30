"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  activeCabinId: string | null;
  cabins: { id: string; position: [number, number, number] }[];
}

type Phase = "overview" | "transit" | "walking";

export default function CameraRig({ activeCabinId, cabins }: Props) {
  const { camera } = useThree();
  const phase = useRef<Phase>("overview");
  const targetPos = useRef(new THREE.Vector3(0, 26, 26));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const lookCurrent = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!activeCabinId) {
      phase.current = "overview";
      targetPos.current.set(0, 26, 26);
      targetLook.current.set(0, 0, 0);
      return;
    }
    const cabin = cabins.find((c) => c.id === activeCabinId);
    if (!cabin) return;
    phase.current = "transit";
    const [x, , z] = cabin.position;
    targetPos.current.set(x, 1.45, z + 2.4);
    targetLook.current.set(x, 0.85, z - 0.3);
  }, [activeCabinId, cabins]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === "Escape") {
        phase.current = "overview";
        targetPos.current.set(0, 26, 26);
        targetLook.current.set(0, 0, 0);
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerp = 1 - Math.pow(0.001, dt);
    const cam = camera as THREE.PerspectiveCamera;

    if (phase.current === "transit") {
      cam.position.lerp(targetPos.current, lerp);
      lookCurrent.current.lerp(targetLook.current, lerp);
      cam.lookAt(lookCurrent.current);
      if (cam.position.distanceTo(targetPos.current) < 0.2) phase.current = "walking";
      return;
    }

    if (phase.current === "walking") {
      const speed = 2.4 * dt;
      const forward = new THREE.Vector3();
      cam.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize();

      if (keys.current["w"] || keys.current["arrowup"]) cam.position.addScaledVector(forward, speed);
      if (keys.current["s"] || keys.current["arrowdown"]) cam.position.addScaledVector(forward, -speed);
      if (keys.current["d"] || keys.current["arrowright"]) cam.position.addScaledVector(right, speed);
      if (keys.current["a"] || keys.current["arrowleft"]) cam.position.addScaledVector(right, -speed);
      cam.position.y = 1.45;
    }

    if (phase.current === "overview") {
      cam.position.lerp(targetPos.current, lerp * 0.5);
      cam.lookAt(0, 0, 0);
    }
  });

  return null;
}