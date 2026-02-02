/* @ts-expect-error */
import externalLink from "./external-link.svg" with { type: "text" };

export const externalLinkIcon = () => {
  const parser = new DOMParser();
  const icon = parser.parseFromString(externalLink, "image/svg+xml").documentElement;

  icon.classList.add("size-4", "shrink-0");
  return icon;
};
