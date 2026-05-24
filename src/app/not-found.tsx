import { VORONOI_LIGHT, SHARD_CLIPS } from "@/constants";

const SHARD_COUNT = 16;

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[100] tile-substrate overflow-hidden flex items-center justify-center">
      {/* Decorative background shards */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
          return (
            <div
              key={i}
              className="absolute opacity-[0.05]"
              style={{
                width: `${100 + i * 50}px`,
                height: `${60 + i * 35}px`,
                backgroundColor: color,
                clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                top: `${20 + i * 14}%`,
                left: `${8 + ((i * 19) % 65)}%`,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full">
        {/* 404 shard mosaic — broken pattern */}
        <div className="flex gap-[3px] h-20 w-56">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
            const isGap = i === 5 || i === 6 || i === 9 || i === 10;
            return (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: isGap ? "transparent" : color,
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  opacity: isGap ? 0 : 0.8,
                }}
              />
            );
          })}
        </div>

        {/* Heading */}
        <h1
          className="text-6xl sm:text-7xl text-white text-center uppercase tracking-wider"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
        >
          404
        </h1>

        {/* Message */}
        <p className="text-white/50 text-center text-base leading-relaxed">
          This page doesn&apos;t exist. It may have been moved or the link might be wrong.
        </p>

        {/* Action */}
        <a
          href="/"
          className="relative py-4 px-12 text-black font-bold uppercase tracking-wider text-base transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-[0.97] focus-visible:outline-none"
          style={{
            backgroundColor: "#cc5533",
            clipPath: SHARD_CLIPS[0],
          }}
        >
          Back to First Day
        </a>
      </div>
    </div>
  );
}
