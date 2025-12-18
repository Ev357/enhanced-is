import { addPdfButtons } from "./add-pdf-buttons";
import { getIsInstance } from "./utils/get-is-instance";

const enhancements = () => {
	if (
		/^\/auth\/el\/fi\/.*\/IB000\/index\.qwarp.*$/.test(window.location.pathname)
	) {
		addPdfButtons();
	}
};

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
