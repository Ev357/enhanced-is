export const parseIcon = (svg: string) => {
  const parser = new DOMParser();
  const icon = parser.parseFromString(svg, "image/svg+xml").documentElement;

  icon.classList.add("size-4", "shrink-0");
  return icon;
};
