import tailwindcss from "bun-plugin-tailwind";

await Bun.build({
  entrypoints: [
    "./src/content.ts",
    "./src/main-content.ts",
    "./src/background.ts",
    "./src/content.css",
  ],
  outdir: "./dist",
  minify: true,
});

await Bun.build({
  entrypoints: ["./src/page.html"],
  outdir: "./dist",
  minify: true,
  plugins: [tailwindcss],
});

const manifest = Bun.file("./src/manifest.json");
await Bun.write("./dist/manifest.json", manifest);

const icon = Bun.file("./assets/icon.png");
await Bun.write("./dist/icon.png", icon);
