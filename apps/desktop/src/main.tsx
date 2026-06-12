import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { env } from "./env";
import "./index.css";

// Apply the validated app name to the document/window title.
document.title = env.VITE_APP_NAME;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
