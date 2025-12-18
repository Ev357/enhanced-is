import { addPdfButtons } from "./add-pdf-buttons";
import { waitUntil } from "./utils/wait-until";

const enhancements = () => {
	if (
		/^\/auth\/el\/fi\/.*\/IB000\/index\.qwarp.*$/.test(window.location.pathname)
	) {
		addPdfButtons();
	}
};

enhancements();

document.addEventListener(
	"click",
	async (event) => {
		if (!(event.target instanceof Element)) return;

		const clickedLink = event.target?.closest(".io-nav-link");
		if (!clickedLink) return;

		// FIXME: This does not always work
		await waitUntil(1000);

		enhancements();
	},
	true,
);
