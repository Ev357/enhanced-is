import { buttonClass } from "../components/button";
import { externalLinkIcon } from "../icons/external-link";

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
		link.className = buttonClass;
		link.href = pdfLink;
		link.target = "_blank";
		link.innerText = "Open pdf in a new tab";

		link.appendChild(externalLinkIcon());

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
