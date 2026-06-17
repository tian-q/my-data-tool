"use client";
import { isUserLoggedIn } from "@/types/auth";
import { useAuthStore } from "./AuthProvider";

/**
 * Selector hook exposing the auth slice to UI. `isLoggedIn` is derived from the
 * profile (Vue `isAuthenticated`), not stored separately.
 */
export function useAuth() {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
	const clearAuth = useAuthStore((s) => s.clearAuth);

	return {
		user,
		isLoggedIn: isUserLoggedIn(user),
		setUser,
		clearAuth,
	};
}
