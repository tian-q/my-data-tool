"use client";
import { TodoStoreProvider } from "@app/core";
import { Toaster } from "sonner";
import { webStorage } from "@/lib/webStorage";
import { AuthProvider } from "@/store/auth/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<TodoStoreProvider storage={webStorage}>
				{children}
				{/* Replaces Element Plus ElMessage; the HTTP client toasts through it. */}
				<Toaster position="top-center" richColors />
			</TodoStoreProvider>
		</AuthProvider>
	);
}
