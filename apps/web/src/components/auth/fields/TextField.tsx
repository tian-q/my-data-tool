"use client";
import { type InputHTMLAttributes, useState } from "react";

// Floating-label underline input, ported from the Vue `.px-field`. When
// `type="password"` it renders the show/hide toggle (own state per field).

interface TextFieldProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: "text" | "tel" | "password";
	maxLength?: number;
	autoComplete?: string;
	inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
	/** Trim on input (Vue `v-model.trim`). */
	trim?: boolean;
	autoFocus?: boolean;
}

export function TextField({
	id,
	label,
	value,
	onChange,
	type = "text",
	maxLength,
	autoComplete,
	inputMode,
	trim = false,
	autoFocus = false,
}: TextFieldProps) {
	const [focused, setFocused] = useState(false);
	const [show, setShow] = useState(false);

	const isPassword = type === "password";
	const active = focused || value.length > 0;
	const inputType = isPassword ? (show ? "text" : "password") : type;

	return (
		<div
			className={`px-field${isPassword ? " px-field--password" : ""}${active ? " is-active" : ""}`}
		>
			<label className="px-field__label" htmlFor={id}>
				{label}
			</label>
			<input
				id={id}
				className="px-field__input"
				type={inputType}
				value={value}
				maxLength={maxLength}
				autoComplete={autoComplete}
				inputMode={inputMode}
				// biome-ignore lint/a11y/noAutofocus: dialog focuses its first field on open, matching the Vue behaviour
				autoFocus={autoFocus}
				onChange={(e) =>
					onChange(trim ? e.target.value.trim() : e.target.value)
				}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>
			{isPassword && (
				<button
					type="button"
					className="px-field__toggle"
					tabIndex={-1}
					aria-label={show ? "隐藏密码" : "显示密码"}
					onClick={() => setShow((s) => !s)}
				>
					{show ? (
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					) : (
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.6}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M3 3l18 18" />
							<path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
							<path d="M9.4 5.6A10 10 0 0 1 22 12a16.7 16.7 0 0 1-2.5 3.3M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-1" />
						</svg>
					)}
				</button>
			)}
			<span className="px-field__line" aria-hidden="true" />
		</div>
	);
}
