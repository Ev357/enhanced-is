import { addDownloadButtons } from "./add-download-buttons";
import { addPdfButtons } from "./add-pdf-buttons";

export const mainEnhancements = async () => {
  if (/^\/auth\/el\/fi\/.*\/IB000\/index\.qwarp.*$/.test(window.location.pathname)) {
    addPdfButtons();
  }

  if (/^\/auth\/el\/fi\/.*\/PB154\/index\.qwarp.*$/.test(window.location.pathname)) {
    addPdfButtons();
  }

  if (/^\/auth\/el\/fi\/.*\/IB002\/index\.qwarp.*$/.test(window.location.pathname)) {
    addDownloadButtons();
  }
};
