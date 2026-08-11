import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";

/**
 * 404 — sleek greyscale, matching the redesign. Renders over the global
 * interactive Voronoi background mounted in the root layout (no solid fill).
 */
export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ fontFamily: FONT }}
    >
      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-md w-full">
        <p className="text-[96px] md:text-[128px] font-semibold tracking-[-0.04em] leading-none text-white/90">
          {COPY.notFound.heading}
        </p>
        <p className="text-[16px] leading-relaxed text-white/55">
          {COPY.notFound.body}
        </p>
        <a
          href="/"
          className="rounded-full bg-white text-black text-[15px] font-semibold py-3.5 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {COPY.notFound.back}
        </a>
      </div>
    </div>
  );
}
