import { createStore } from "zustand/vanilla";
import { clearAccessToken } from "@/lib/http/token";
import type { AuthState, User } from "@/types/auth";

// Auth store, mirroring the core `createTodoStore` factory style (vanilla store,
// no React). Replaces the Vuex `userInfo` module + `auth:cleared` handling.

export function createAuthStore() {
	return createStore<AuthState>((set) => ({
		user: null,

		setUser: (user: User | null) => set({ user }),

		clearAuth: () => {
			// Clear the in-memory token alongside the profile so a stale token can't
			// outlive the session. Matches Vue `clearUserAuthState`.
			clearAccessToken();
			set({ user: null });
			// NOTE: workbench cache invalidation (Vue `invalidateWorkbenchAll`) will
			// be wired in here once the workbench is migrated.
		},
	}));
}

export type AuthStore = ReturnType<typeof createAuthStore>;
