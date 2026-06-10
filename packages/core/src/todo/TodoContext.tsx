"use client";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { useStore } from "zustand";
import type { StorageAdapter } from "../shared/storage/StorageAdapter";
import {
	createTodoStore,
	type TodoState,
	type TodoStore,
} from "./createTodoStore";

const TodoStoreContext = createContext<TodoStore | null>(null);

export function TodoStoreProvider({
	storage,
	children,
}: {
	storage: StorageAdapter;
	children: ReactNode;
}) {
	// Create the store exactly once for the lifetime of this provider.
	const storeRef = useRef<TodoStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createTodoStore(storage);
	}

	useEffect(() => {
		void storeRef.current?.getState().load();
	}, []);

	return (
		<TodoStoreContext.Provider value={storeRef.current}>
			{children}
		</TodoStoreContext.Provider>
	);
}

export function useTodoStore<T>(selector: (state: TodoState) => T): T {
	const store = useContext(TodoStoreContext);
	if (!store) {
		throw new Error("useTodoStore must be used within a TodoStoreProvider");
	}
	return useStore(store, selector);
}
