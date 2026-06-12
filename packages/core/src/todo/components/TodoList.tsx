"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useTodoStore } from "../TodoContext";

export function TodoList() {
	const todos = useTodoStore((s) => s.todos);
	const toggle = useTodoStore((s) => s.toggle);
	const remove = useTodoStore((s) => s.remove);
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: todos.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 44, // estimated row height in px
		overscan: 10,
	});

	return (
		<div ref={parentRef} className="h-96 overflow-auto rounded border">
			<div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
				{virtualizer.getVirtualItems().map((row) => {
					const todo = todos[row.index];
					if (!todo) return null;
					return (
						<div
							key={todo.id}
							className="absolute left-0 flex w-full items-center gap-2 px-3"
							style={{
								height: row.size,
								transform: `translateY(${row.start}px)`,
							}}
						>
							<input
								type="checkbox"
								checked={todo.done}
								onChange={() => toggle(todo.id)}
							/>
							<span className={todo.done ? "text-gray-400 line-through" : ""}>
								{todo.title}
							</span>
							<button
								type="button"
								onClick={() => remove(todo.id)}
								className="ml-auto text-red-500"
								aria-label="delete"
							>
								×
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
