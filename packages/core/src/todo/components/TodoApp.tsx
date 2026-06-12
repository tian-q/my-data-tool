"use client";
import { AddTodo } from "./AddTodo";
import { TodoList } from "./TodoList";

export function TodoApp() {
	return (
		<main className="mx-auto max-w-md space-y-4 p-6">
			<h1 className="text-2xl font-semibold">Todos</h1>
			<AddTodo />
			<TodoList />
		</main>
	);
}
