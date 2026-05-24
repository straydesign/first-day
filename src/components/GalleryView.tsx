"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Globe } from "lucide-react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { SPRING } from "@/lib/animations";
import { publishRoom } from "@/lib/social/rooms";
import { getGalleryMarkers, setGalleryMarkers, setFreshMarker } from "./3d-shell/galleryIntent";
import type { Plan, Goal, PublicRoomMarker } from "@/types";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;
const PANEL_PUBLISH_PALETTE = ["#1a3a2a", "#1f4a30", "#2a5a3a", "#163a26", "#234a36"] as const;

interface GalleryViewProps {
  onBack: () => void;
  userId?: string;
  plan?: Plan | null;
  goalId?: string | null;
  goalTitle?: string | null;
  onPublished?: (roomId: string) => void;
}

type PublishState = "idle" | "publishing" | "published" | "error";

export function GalleryView({ onBack, userId, plan, goalId, goalTitle, onPublished }: GalleryViewProps) {
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canPublish = Boolean(userId && plan && goalId && goalTitle);

  useEffect(() => {
    if (publishState !== "published") return;
    const t = setTimeout(() => setPublishState("idle"), 2400);
    return () => clearTimeout(t);
  }, [publishState]);

  async function handlePublish() {
    if (!userId || !plan || !goalId || !goalTitle || publishState === "publishing") return;
    setPublishState("publishing");
    setErrorMsg(null);
    // Synthesize the minimal Goal shape publishRoom needs. Only `title` is read
    // server-side; the other required fields are filled with caller-known state
    // so the contract type-checks without forcing the parent to keep the full
    // Goal in scope (AuthenticatedApp tracks goalData as a display projection).
    const goal: Goal = {
      id: goalId,
      title: goalTitle,
      startDate: plan.startDate ?? new Date().toISOString(),
      completedDays: 0,
      totalDays: plan.days ? Object.keys(plan.days).length : 7,
    };
    try {
      const row = await publishRoom({ plan, goal, ownerUserId: userId });
      // Materialize the fresh room locally so the cosmos visibly RECEIVES the marker
      // the moment the wire returns — no waiting on the next gallery mount/refetch.
      // setFreshMarker triggers an elastic overshoot scale ramp in GalleryMarkers.
      const newMarker: PublicRoomMarker = {
        id: row.id,
        ownerUserId: row.owner_user_id,
        goalTitle: row.goal_title,
        position: [row.position_x, row.position_y, row.position_z],
        color: row.color,
        updatedAt: row.updated_at,
      };
      const existing = getGalleryMarkers();
      setGalleryMarkers([...existing.filter((m) => m.id !== row.id), newMarker]);
      setFreshMarker(row.id);
      setPublishState("published");
      onPublished?.(row.id);
    } catch (e) {
      setPublishState("error");
      setErrorMsg(e instanceof Error ? e.message : "Couldn't publish");
    }
  }

  return (
    <div className="min-h-screen w-full">
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={SPRING.gentle}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-white text-sm font-bold uppercase tracking-wider overflow-hidden"
      >
        <VoronoiMosaic seed={9101} tileCount={16} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
        <ChevronLeft className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Back</span>
      </motion.button>

      {canPublish && (
        <motion.button
          onClick={handlePublish}
          disabled={publishState === "publishing"}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.gentle, delay: 0.2 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 text-white text-sm font-bold uppercase tracking-wider overflow-hidden disabled:opacity-60"
        >
          <VoronoiMosaic seed={9103} tileCount={20} margin={3} gap={2} palette={PANEL_PUBLISH_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
          <Globe className="w-4 h-4 relative z-10" />
          <span className="relative z-10">
            {publishState === "publishing" && "Publishing…"}
            {publishState === "published" && "Live"}
            {publishState === "error" && "Retry"}
            {publishState === "idle" && "Publish room"}
          </span>
        </motion.button>
      )}

      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-xs w-[88%]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.gentle, delay: 0.4 }}
          className="relative overflow-hidden px-5 py-4 text-center"
        >
          <VoronoiMosaic seed={9102} tileCount={36} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
          <div className="relative z-10">
            <div className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-1.5 opacity-70">Observatory</div>
            <div className="text-white/90 text-sm leading-relaxed">
              Each marker is another planner&rsquo;s room. Fly toward one to see their wall shatter open.
            </div>
            {errorMsg && (
              <div className="text-rose-300/90 text-xs mt-2">{errorMsg}</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
