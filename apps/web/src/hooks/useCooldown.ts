"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Button cooldown countdown, ported from the Vue `useCooldown` (utils/errorMessage.js).
 *
 * Usage A — preventive (start before/after a request to stop double-clicks):
 *   await sendSmsCode(...); cooldown.start(60);
 * Usage B — rate-limit fallback (e.g. on a 3003): cooldown.start(5) in `catch`.
 */
export function useCooldown() {
	const [remaining, setRemaining] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stop = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setRemaining(0);
	}, []);

	const start = useCallback((seconds = 5) => {
		if (timerRef.current) clearInterval(timerRef.current);
		setRemaining(seconds);
		timerRef.current = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					if (timerRef.current) {
						clearInterval(timerRef.current);
						timerRef.current = null;
					}
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}, []);

	// Clear the timer on unmount (mirrors Vue onBeforeUnmount(stop)).
	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	return { remaining, start, stop };
}
