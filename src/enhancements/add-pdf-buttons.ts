/* @ts-expect-error */
import externalLink from "../icons/external-link.svg" with { type: "text" };

export const addPdfButtons = () => {
	const data = document.querySelectorAll(
		'object[data^="/pdfjs/web/viewer.html"]',
	);

	data.forEach((element) => {
		const previousElement = element.previousElementSibling;
		if (
			previousElement instanceof HTMLElement &&
			previousElement.dataset.enhancedIs === "true"
		)
			return;

		const data = element.attributes.getNamedItem("data")?.value;
		if (!data) return;

		const pdfLink = /^\/pdfjs\/web\/viewer\.html\?file=(.*.pdf)$/.exec(
			data,
		)?.[1];
		if (!pdfLink) return;

		const link = document.createElement("a");
		link.className =
			"hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none";
		link.href = pdfLink;
		link.target = "_blank";
		link.innerText = "Open pdf in a new tab";

		const parser = new DOMParser();
		const ExternalLink = parser.parseFromString(
			externalLink,
			"image/svg+xml",
		).documentElement;

		ExternalLink.classList.add("size-4", "shrink-0");

		link.appendChild(ExternalLink);

		const div = document.createElement("div");
		div.className = "flex justify-end";
		div.appendChild(link);

		const container = document.createElement("div");
		container.dataset.enhancedIs = "true";
		container.style.display = "contents";
		container.appendChild(div);

		element.before(container);
	});
};
