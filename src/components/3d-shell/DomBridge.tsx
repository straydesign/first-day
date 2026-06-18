"use client";

import { type ReactNode } from "react";

// DomBridge portaling is disabled: the 3D shell stays as a fixed-position
// background, page content flows normally above it, modals open against
// document.body. The Host/Source/host-hook contracts are preserved as
// no-ops so callers (ActivePanel, Dialog/AlertDialog/Sheet) keep compiling.
export function setDomBridgeHost(_el: HTMLElement | null) {}

export function useDomBridgeHost(): HTMLElement | null {
  return null;
}

export function DomBridgeSource({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DomBridgeHost({
  className,
  style,
  ...rest
}: {
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} style={style} {...rest} />;
}
