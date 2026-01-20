import { addPdfButtons } from "./add-pdf-buttons";

export const enhancements = () => {
	if (
		/^\/auth\/el\/fi\/.*\/IB000\/index\.qwarp.*$/.test(window.location.pathname)
	) {
		addPdfButtons();
	}

	if (
		/^\/auth\/el\/fi\/.*\/PB154\/index\.qwarp.*$/.test(window.location.pathname)
	) {
		addPdfButtons();
	}
};
