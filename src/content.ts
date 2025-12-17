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
		link.href = pdfLink;
		link.target = "_blank";
		link.innerText = "Open pdf in a new tab";
		link.style.border = "1px solid black";
		link.style.borderRadius = "4px";
		link.style.padding = "2px 4px";
		element.before(link);
	});
}
