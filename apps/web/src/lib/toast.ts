import { toast as sonner } from "sonner";

// Toast wrapper replacing Element Plus `ElMessage`. The <Toaster/> is mounted in
// app/providers.tsx; `sonner` is a global emitter so this can be called from
// anywhere (including the axios interceptor), not just React components.

interface ToastOptions {
	/** X-Request-ID — appended to the description so support can grep logs. */
	requestId?: string;
}

function withRequestId(options?: ToastOptions) {
	return options?.requestId
		? { description: `request-id: ${options.requestId}` }
		: undefined;
}

export const toast = {
	success(message: string, options?: ToastOptions) {
		sonner.success(message, withRequestId(options));
	},
	error(message: string, options?: ToastOptions) {
		sonner.error(message, withRequestId(options));
	},
	warning(message: string, options?: ToastOptions) {
		sonner.warning(message, withRequestId(options));
	},
	info(message: string, options?: ToastOptions) {
		sonner.info(message, withRequestId(options));
	},
};
