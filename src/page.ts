import browser from "webextension-polyfill";
import type { Subject } from "./enhancements/compute";

(async () => {
	const data = await browser.storage.local.get("subjects");
	/* @ts-expect-error */
	const subjects: Subject[] = data.subjects;
	console.log(subjects);
})();
