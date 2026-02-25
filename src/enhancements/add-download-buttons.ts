import { buttonClass } from "../components/button";
import { downloadIcon } from "../icons/download";

export const addDownloadButtons = () => {
  const buttonLinks = Array.from(
    document.querySelectorAll(
      "div.io-element.io-element-odkaz > div.io-odkaz-prvek > div.row.collapse",
    ),
  );

  const fileDownloadDivs = buttonLinks.filter((linkDiv) => {
    const icon = linkDiv.querySelector("div.io-kat-div > i.io-kat-ikona.isi-soubor-otevrit-h30");

    return !!icon;
  });

  for (const fileDownloadDiv of fileDownloadDivs) {
    const originalLink = fileDownloadDiv.querySelector(
      "div.io-odkaz-prvek-obsah a.io-element-title",
    );

    if (!originalLink || !(originalLink instanceof HTMLAnchorElement)) continue;

    const previousContainer = fileDownloadDiv.querySelector('div[data-enhanced-is="true"]');
    if (previousContainer) continue;

    const fileLink = originalLink.href.split("?")[0];
    if (!fileLink) continue;

    const link = document.createElement("a");
    link.className = buttonClass;
    link.href = fileLink;
    link.download = originalLink.textContent;
    link.innerText = "Download";

    link.appendChild(downloadIcon());

    const div = document.createElement("div");
    div.className = "flex justify-end";
    div.appendChild(link);

    const container = document.createElement("div");
    container.dataset.enhancedIs = "true";
    container.style.display = "contents";
    container.appendChild(div);

    fileDownloadDiv.appendChild(container);
  }
};
