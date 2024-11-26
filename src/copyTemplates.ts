import { glob } from "glob";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
	const distTemplatePath = path.join(process.cwd(), "dist", "templates");
	await rm(distTemplatePath, { force: true, recursive: true });

	const basePath = path.join(process.cwd(), "templates");
	const files = await glob("**/*", { absolute: false, cwd: basePath, dot: true, nodir: true });
	await Promise.all(
		files.map(async (p) => {
			const from = path.resolve(basePath, p);
			const to = path.join(distTemplatePath, p);
			await mkdir(path.dirname(to), { recursive: true });
			await writeFile(to, await readFile(from));
		})
	);
}

main();
