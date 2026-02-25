/* @ts-expect-error */
import externalLink from "./external-link.svg" with { type: "text" };
import { parseIcon } from "../utils/parse-icon";

export const externalLinkIcon = () => parseIcon(externalLink);
