"use client";
import { useState } from "react";
import { useTodoStore } from "../TodoContext";

export function AddTodo() {
	const add = useTodoStore((s) => s.add);
	const [title, setTitle] = useState("");

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const trimmed = title.trim();
				if (trimmed) {
					void add(trimmed);
					setTitle("");
				}
			}}
			className="flex gap-2"
		>
			<input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="What needs to be done?"
				className="flex-1 rounded border px-3 py-2"
			/>
			<button
				type="submit"
				className="rounded bg-blue-600 px-4 py-2 text-white"
			>
				Add
			</button>
		</form>
	);
}
