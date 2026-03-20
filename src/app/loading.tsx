import { VORONOI_LIGHT, SHARD_CLIPS } from "@/constants";

const SHARD_COUNT = 20;

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-8 px-6">
      {/* Shard progress bar — animated via CSS keyframes */}
      <div className="w-full max-w-md">
        <div className="flex gap-[2px] h-3 w-full">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
            return (
              <div
                key={i}
                className="flex-1"
                style={{
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  backgroundColor: color,
                  animation: `shardPulse 1.6s ease-in-out ${i * 0.08}s infinite`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
