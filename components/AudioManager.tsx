"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export default function AudioManager({ activeCabinId }: { activeCabinId: string | null }) {
  const { camera } = useThree();
  const ambient = useRef<HTMLAudioElement | null>(null);
  const rustle = useRef<HTMLAudioElement | null>(null);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const a = new Audio("/audio/study-ambience.mp3");
    a.loop = true;
    a.volume = 0;
    ambient.current = a;

    const r = new Audio("/audio/paper-rustle.mp3");
    r.volume = 0.5;
    rustle.current = r;

    const kick = () => {
      a.volume = 0.22;
      a.play().catch(() => {});
      window.removeEventListener("click", kick);
    };
    window.addEventListener("click", kick, { once: true });

    return () => {
      a.pause();
      r.pause();
    };
  }, []);

  useEffect(() => {
    if (activeCabinId && activeCabinId !== prev.current && rustle.current) {
      rustle.current.currentTime = 0;
      rustle.current.play().catch(() => {});
      if (ambient.current) ambient.current.volume = 0.32;
    }
    if (!activeCabinId && ambient.current) ambient.current.volume = 0.18;
    prev.current = activeCabinId;
  }, [activeCabinId]);

  void camera;
  return null;
}