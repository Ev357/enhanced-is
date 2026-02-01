import { compute } from "./compute";

export const enhancements = async () => {
	if (/^\/auth\/seminare\/student.*$/.test(window.location.pathname)) {
		const result = await compute();
		if (result instanceof Error) {
			console.error(result);
		}
	}
};
