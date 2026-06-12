"use client";
import { TodoStoreProvider } from "@app/core";
import { webStorage } from "@/lib/webStorage";

export function Providers({ children }: { children: React.ReactNode }) {
	return <TodoStoreProvider storage={webStorage}>{children}</TodoStoreProvider>;
}
