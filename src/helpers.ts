import { execSync } from "child_process";
import { rmSync } from "fs";
import { access } from "fs/promises";
import { W_OK } from "node:constants";
import path from "node:path";

export function isValidPackageName(projectName: string) {
	return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

export function pkgFromUserAgent(userAgent: string | undefined) {
	if (!userAgent) return undefined;
	const pkgSpec = userAgent.split(" ")[0];
	const pkgSpecArr = pkgSpec.split("/");
	return {
		name: pkgSpecArr[0],
		version: pkgSpecArr[1],
	};
}

export async function hasAccess(path: string) {
	try {
		await access(path, W_OK);
		return true;
	} catch {
		return false;
	}
}

export function getTemplatePath(typeScript: boolean) {
	return path.join(__dirname, "..", "templates", typeScript ? "ts" : "js");
}

export function runFile(file: string, isBun: boolean, typescript: boolean) {
	return `${isBun ? "bun run" : (typescript ? "tsx" : "node") + " --env-file=.env"} ${file}${typescript ? ".ts" : ".js"}`;
}

export function gitInit(rootDir: string) {
	let initStarted = false;
	try {
		execSync("git --version", { stdio: "ignore" });

		if (isInGitRepo()) return false;

		execSync("git init", { stdio: "ignore" });
		initStarted = true;

		if (!defaultBranchSet()) execSync("git checkout -b master", { stdio: "ignore" });
		return true;
	} catch {
		if (initStarted) {
			try {
				rmSync(path.join(rootDir, ".git"), { recursive: true, force: true });
			} catch {}
		}
		return false;
	}
}

function isInGitRepo() {
	try {
		execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
		return true;
	} catch (_) {}
	return false;
}

function defaultBranchSet() {
	try {
		execSync("git config init.defaultBranch", { stdio: "ignore" });
		return true;
	} catch (_) {}
	return false;
}
