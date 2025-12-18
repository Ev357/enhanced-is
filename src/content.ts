/* @ts-expect-error */
import externalLink from "./icons/external-link.svg" with { type: "text" };

if (
	/^\/auth\/el\/fi\/.*\/IB000\/index\.qwarp.*$/.test(window.location.pathname)
) {
	const data = document.querySelectorAll(
		'object[data^="/pdfjs/web/viewer.html"]',
	);

	data.forEach((element) => {
		const data = element.attributes.getNamedItem("data")?.value;
		if (!data) return;

		const pdfLink = /^\/pdfjs\/web\/viewer\.html\?file=(.*.pdf)$/.exec(
			data,
		)?.[1];
		if (!pdfLink) return;

		const link = document.createElement("a");
		link.className =
			"enhanced-is inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-accent hover:text-accent-foreground border shadow-xs h-9 px-4 py-2";
		link.href = pdfLink;
		link.target = "_blank";
		link.innerText = "Open pdf in a new tab";

		// biome-ignore lint/style/noNonNullAssertion: Icon will be always present
		const ExternalLink = document
			.createRange()
			.createContextualFragment(externalLink).firstElementChild!;

		ExternalLink.classList.add("enhanced-is", "size-4", "shrink-0");

		link.appendChild(ExternalLink);

		const div = document.createElement("div");
		div.className = "enhanced-is flex justify-end";
		div.appendChild(link);

		element.before(div);
	});
}
