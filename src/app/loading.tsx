import { VORONOI_LIGHT, SHARD_CLIPS, LABEL_CLIPS, getClip } from "@/constants";

const SHARD_COUNT = 20;
const WORDMARK = ["FIRST", "DAY"] as const;

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] tile-substrate flex flex-col items-center justify-center gap-10 px-6">
      <div className="flex flex-col items-center gap-2">
        {WORDMARK.map((word, i) => (
          <span
            key={word}
            className="inline-block bg-black px-6 py-2 text-4xl md:text-6xl font-black text-white uppercase leading-none"
            style={{
              clipPath: getClip(LABEL_CLIPS, i),
              fontFamily: "var(--font-bebas), system-ui, sans-serif",
              letterSpacing: 4,
              backgroundColor: VORONOI_LIGHT[i % VORONOI_LIGHT.length],
              color: "#000",
            }}
          >
            {word}
          </span>
        ))}
      </div>

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
