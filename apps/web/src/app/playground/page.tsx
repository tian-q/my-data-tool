import { TodoApp } from "@app/core";

// The original scaffold home (@app/core TodoApp) moved here per §0.3 so the
// landing page can take `/`. Kept reachable; do not delete TodoApp.
export default function Playground() {
	return <TodoApp />;
}
