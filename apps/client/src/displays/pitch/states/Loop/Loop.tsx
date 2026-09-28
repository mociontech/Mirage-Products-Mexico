import { useEffect, useState } from 'react';
import { VideoLayer, type VideoSource } from '../../../../components/VideoLayer/VideoLayer';
import pitchLoopAcaire from '../../../../assets/video/pitch-loop-acaire.mp4';
import pitchLoopAcaire2 from '../../../../assets/video/pitch-loop-acaire-2.mp4';
import pitchLoopAcaire3 from '../../../../assets/video/pitch-loop-acaire-3.mp4';

/**
 * Loop principal de la pitch cuando no hay ninguna sesion activa - el video
 * de marca (ACAIRE) que reemplaza al viejo fondo estatico de IDLE en ese rol.
 * IDLE (fondo + particulas) pasa a ser solo el fallback de error/timeout del
 * watchdog, no la pantalla de reposo normal (ver PitchApp.tsx).
 *
 * Tres clips en el pool: el principal (pitchLoopAcaire) es el que mas se ve,
 * los otros dos son variantes que entran de vez en cuando para que no se
 * sienta siempre igual - un timer cambia el clip visible cada
 * VARIETY_INTERVAL_MS con un sorteo pesado hacia el principal. Los tres
 * quedan montados y reproduciendo todo el tiempo (VideoLayer), el cambio es
 * solo un crossfade de opacity, nunca un remount/buffer.
 */
const CLIPS: VideoSource[] = [
  { id: 'main', src: pitchLoopAcaire },
  { id: 'variant-2', src: pitchLoopAcaire2 },
  { id: 'variant-3', src: pitchLoopAcaire3 },
];

const VARIETY_INTERVAL_MS = 75_000;
/** Peso del clip principal frente a cada variante al sortear el siguiente. */
const MAIN_WEIGHT = 3;

function pickNextClipId(currentId: string): string {
  const weighted = CLIPS.flatMap((clip) => Array(clip.id === 'main' ? MAIN_WEIGHT : 1).fill(clip.id));
  const choices = weighted.filter((id) => id !== currentId);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function Loop() {
  const [activeId, setActiveId] = useState('main');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveId((current) => pickNextClipId(current));
    }, VARIETY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return <VideoLayer sources={CLIPS} activeId={activeId} />;
}
