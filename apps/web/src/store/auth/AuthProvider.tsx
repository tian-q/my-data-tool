"use client";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { useStore } from "zustand";
import { getMeApi, refreshTokenApi } from "@/lib/api/auth";
import { onAuthCleared, setAccessToken } from "@/lib/http/token";
import type { AuthState } from "@/types/auth";
import { type AuthStore, createAuthStore } from "./authStore";

// Context holds the store instance (not state), so consumers subscribe via
// zustand selectors. Same shape as core's TodoStoreProvider.
const AuthStoreContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	// Create the store exactly once for the lifetime of this provider.
	const storeRef = useRef<AuthStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createAuthStore();
	}

	useEffect(() => {
		const store = storeRef.current;
		if (!store) return;
		let cancelled = false;

		// Bootstrap: swap the refresh cookie for an access token, then load the
		// profile. Mirrors Vue `main.js` initAuthState — any failure clears auth.
		(async () => {
			try {
				const refreshed = await refreshTokenApi();
				const token = refreshed?.data?.access_token;
				if (!token) throw new Error("missing access token");
				setAccessToken(token);
				const me = await getMeApi();
				if (!cancelled) store.getState().setUser(me?.data ?? null);
			} catch {
				if (!cancelled) store.getState().clearAuth();
			}
		})();

		// React to forced logout / refresh failure broadcast by the HTTP client.
		const unsub = onAuthCleared(() => store.getState().clearAuth());
		return () => {
			cancelled = true;
			unsub();
		};
	}, []);

	return (
		<AuthStoreContext.Provider value={storeRef.current}>
			{children}
		</AuthStoreContext.Provider>
	);
}

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
	const store = useContext(AuthStoreContext);
	if (!store) {
		throw new Error("useAuthStore must be used within an AuthProvider");
	}
	return useStore(store, selector);
}
