await Bun.build({
	entrypoints: ["./src/content.ts", "./src/content.css"],
	outdir: "./dist",
	minify: true,
});

const manifest = Bun.file("./src/manifest.json");
await Bun.write("./dist/manifest.json", manifest);

const icon = Bun.file("./assets/icon.png");
await Bun.write("./dist/icon.png", icon);
