"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRoomView } from "./RoomRegistry";

/**
 * VISION.md Phase 5: "bloom on the reward room."
 *
 * Conditional mount: composer only attaches when the active view is congrats,
 * keeping non-celebration rooms on the cheap forward-render path. The fade-in
 * is handled implicitly by the room's own pulse — accent tiles cross the
 * luminance threshold as they assemble, so the haze blooms in alongside them.
 */

export function CongratsBloom() {
  const view = useRoomView();
  if (view !== "congrats") return null;
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        blendFunction={BlendFunction.ADD}
        intensity={1.6}
        luminanceThreshold={0.42}
        luminanceSmoothing={0.25}
        radius={0.78}
        mipmapBlur
      />
    </EffectComposer>
  );
}
