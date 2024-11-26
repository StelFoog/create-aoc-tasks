import { glob } from "glob";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import path, { basename, dirname, resolve } from "node:path";
import ora from "ora";
import colors from "picocolors";
import prompts from "prompts";
import {
	getTemplatePath,
	gitInit,
	hasAccess,
	isValidPackageName,
	pkgFromUserAgent,
	runFile,
} from "./helpers";

const packageManagers = [
	{ name: "npm", color: colors.red },
	{ name: "bun", color: colors.whiteBright },
	{ name: "pnpm", color: colors.yellow },
	{ name: "yarn", color: colors.blue },
	// { name: "yarn modern", color: colors.magenta },
];

const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
const pkgManager = pkgInfo ? pkgInfo.name : null;
// const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");

// npm = red
// yarn classic = blue
// yarn modern = purple
// pnpm = yellow / orange
// bun = pink / white

async function main() {
	const res = await prompts(
		[
			{
				type: "number",
				message: "What year?",
				name: "year",
				initial: new Date().getFullYear(),
			},
			{
				type: "text",
				name: "pkgName",
				message: "Package name?",
				initial: (_, ctx) => `advent-of-code-${ctx.year}`,
				validate: (name) => {
					if (isValidPackageName(basename(resolve(name)))) return true;
					return "Invalid project name";
				},
			},
			{
				type: "toggle",
				name: "typescript",
				message: "Would you like to use TypeScript?",
				active: "Yes",
				inactive: "No",
				initial: true,
			},
			{
				type: "toggle",
				name: "elfHelp",
				message: "Would you like a helper elf (install elf-help)?",
				active: "Yes",
				inactive: "No",
				initial: true,
			},
			{
				type: "toggle",
				name: "prettier",
				message: "Would you like to include a prettier configuration?",
				active: "Yes",
				inactive: "No",
				initial: true,
			},
			{
				type: () => (pkgManager ? null : "select"),
				name: "pkgManager",
				message: "What package manager would you like to use?",
				choices: packageManagers.map((pm) => ({
					title: pm.color(pm.name),
					value: pm.name,
				})),
			},
		],
		{
			onCancel: () => {
				throw new Error();
			},
		}
	).catch((e) => {
		process.exit(1);
	});

	const appPath = resolve(res.pkgName);
	const parentDir = dirname(appPath);

	if (!(await hasAccess(parentDir))) {
		console.error(
			"It is not possible to write to the application path.\nIt is likely that you lack the permissions to write in this folder."
		);
		process.exit(1);
	}

	await mkdir(appPath, { recursive: true });
	if (await readdir(appPath).then((f) => !!f.length)) {
		console.error("Application directory is not empty.");
		process.exit(1);
	}

	process.chdir(appPath);

	const templatePath = getTemplatePath(res.typescript);
	const templateFiles = await glob("**/*", {
		ignore: "README.md",
		cwd: templatePath,
		absolute: false,
		dot: true,
		nodir: true,
	});

	const destRelativeToCwd = resolve(templatePath, appPath);

	const copySpinner = ora("Creating project...").start();

	await Promise.all(
		templateFiles.map(async (p) => {
			let baseName = basename(p);
			const dirName = dirname(p);
			if (baseName.startsWith("__KEEP")) baseName = baseName.slice("__KEEP".length);

			const from = resolve(templatePath, p);
			const to = path.join(destRelativeToCwd, dirName, baseName);

			await mkdir(dirname(to), { recursive: true });
			await writeFile(to, await readFile(from));
		})
	);

	const packageManager = pkgManager ?? res.pkgManager;
	const isBun = packageManager === "bun";

	const packageJson = {
		name: res.pkgName,
		type: "module",
		scripts: {
			task: runFile("src/index", isBun, res.typescript),
			"make-day": runFile("src/makeDay", isBun, res.typescript),
		},
		dependencies: undefined as any,
		devDependencies: undefined as any,
		prettier: undefined as any,
	};

	if (res.prettier) {
		packageJson.prettier = {
			arrowParens: "always",
			bracketSpacing: true,
			jsxSingleQuote: false,
			printWidth: 100,
			semi: true,
			tabWidth: 2,
			useTabs: true,
			trailingComma: "es5",
		};
	}

	if (res.typescript) {
		packageJson.devDependencies = isBun
			? { "@types/bun": "latest", typescript: "^5" }
			: { "@types/node": "latest", typescript: "^5", tsx: "^4" };
	}

	const readme = await readFile(path.join(templatePath, "README.md")).then((v) =>
		v
			.toString()
			.replace(/{{year}}/g, res.year)
			.replace(
				/{{lang}}/g,
				`${res.typescript ? "TypeScript" : "JavaScript"} and ${packageManager === "bun" ? "Bun" : "Node"}`
			)
			.replace(/{{packageManagerRun}}/g, packageManager === "npm" ? "npm run" : packageManager)
			.replace(/{{packageManager}}/g, packageManager)
	);

	await writeFile(path.join(appPath, "package.json"), JSON.stringify(packageJson, null, 2) + EOL);
	await writeFile(path.join(appPath, "README.md"), readme);
	await writeFile(path.join(appPath, ".env"), "AOC_SESSION=");

	await mkdir(path.join(appPath, "inputs"));
	await mkdir(path.join(appPath, "tasks"));

	gitInit(appPath);

	copySpinner.succeed("Created template");

	if (res.typescript || res.elfHelp) {
		const installSpinner = ora("Installing dependencies...").start();

		if (res.typescript) {
			await new Promise<void>((resolve, reject) => {
				const child = spawn(packageManager, ["install"], {
					stdio: "ignore",
					env: {
						...process.env,
						ADBLOCK: "1",
						// we set NODE_ENV to development as pnpm skips dev dependencies when production
						NODE_ENV: "development",
						DISABLE_OPENCOLLECTIVE: "1",
					},
				});
				child.stdout?.on("data", () => {});
				child.on("close", (code) => {
					if (code !== 0) return reject();

					resolve();
				});
			});
		}

		if (res.elfHelp) {
			await new Promise<void>((resolve, reject) => {
				const child = spawn(packageManager, ["add", "elf-help"], {
					stdio: "ignore",
					env: {
						...process.env,
						ADBLOCK: "1",
						// we set NODE_ENV to development as pnpm skips dev dependencies when production
						NODE_ENV: "development",
						DISABLE_OPENCOLLECTIVE: "1",
					},
				});
				child.on("close", (code) => {
					if (code !== 0) return reject();

					resolve();
				});
			});
		}

		installSpinner.succeed("Installed dependencies");
	}

	console.log();
	console.log(
		`Navigate to ${res.pkgName} and run ${colors.bgBlack(colors.bold(`${packageManager === "npm" ? "npm run" : packageManager} make-day [day]`))} to create files to get started`
	);
	console.log();
}

main();
