// expect 3
import { useEffect, useLayoutEffect } from "react";
declare const video: HTMLVideoElement;
export function A({ load }: { load: () => Promise<void> }) {
  useEffect(async () => {
    await load();
  }, [load]);
  useEffect(() => fetch("/api"), []);
  useLayoutEffect(() => video.play(), []);
  return null;
}
