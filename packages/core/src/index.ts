// Public entry point for @app/core.
// Components are added in step 6.
export type { StorageAdapter } from "./storage/StorageAdapter";
export { createTodoStore, type TodoState } from "./store/createTodoStore";
export { TodoStoreProvider, useTodoStore } from "./store/TodoContext";
export type { Todo } from "./types";
