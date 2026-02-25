/* @ts-expect-error */
import download from "./download.svg" with { type: "text" };
import { parseIcon } from "../utils/parse-icon";

export const downloadIcon = () => parseIcon(download);
