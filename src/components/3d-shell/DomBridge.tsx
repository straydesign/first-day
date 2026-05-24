"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

let host: HTMLElement | null = null;
const subs = new Set<() => void>();

const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
};
const getSnapshot = () => host;
const getServerSnapshot = () => null;
const notify = () => subs.forEach((cb) => cb());

export function setDomBridgeHost(el: HTMLElement | null) {
  if (host === el) return;
  host = el;
  notify();
}

/**
 * Subscribe to the bridge host element. Returns null until DomBridgeHost mounts.
 * Used by Dialog/AlertDialog portals so modals render INSIDE the Canvas-anchored
 * Html (not as flat overlays on document.body) — keeps the no-flat-bg vision.
 */
export function useDomBridgeHost(): HTMLElement | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Renders {children} inline during SSR + first client render so hydration matches,
 * then teleports them into the in-Canvas Html host once both the host element exists
 * and the client has mounted (post-hydration). Children mount/unmount lifecycle is
 * preserved because createPortal keeps them in the same React subtree.
 */
export function DomBridgeSource({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const target = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (mounted && target) {
    return createPortal(children, target);
  }
  return <>{children}</>;
}

/**
 * Registers a div as the host element. Mount once inside the active room's
 * Html anchor inside the Canvas. The div is filled by whatever children
 * DomBridgeSource is currently portaling.
 */
export function DomBridgeHost({
  className,
  style,
  ...rest
}: {
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setDomBridgeHost(ref.current);
    return () => setDomBridgeHost(null);
  }, []);
  return <div ref={ref} className={className} style={style} {...rest} />;
}
