import { TodoApp, TodoStoreProvider } from "@app/core";
import { tauriStorage } from "./tauriStorage";

export default function App() {
	return (
		<TodoStoreProvider storage={tauriStorage}>
			<TodoApp />
		</TodoStoreProvider>
	);
}
