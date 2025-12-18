import { enhancements } from "./enhancements";
import { getIsInstance } from "./utils/get-is-instance";

enhancements();

(() => {
	const is = getIsInstance();
	if (!is) return;

	const originalCallInit = is.Design.call_init;
	is.Design.call_init = function (...rest) {
		originalCallInit.apply(this, rest);

		enhancements();
	};
})();
