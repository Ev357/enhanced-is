export type IS = {
	Design: {
		call_init: () => void;
	};
};

const isValidInstance = (obj: unknown): obj is IS =>
	typeof obj === "function" &&
	"Design" in obj &&
	typeof obj.Design === "object" &&
	obj.Design !== null &&
	"call_init" in obj.Design &&
	typeof obj.Design.call_init === "function";

export const getIsInstance = () => {
	if (!("is" in window)) return;

	const is = window.is;

	if (!isValidInstance(is)) return;

	return is;
};
