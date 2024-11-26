import fs from "fs/promises";
import path from "path";
import pkg from "../package.json";
import { TASK_CONTENT } from "./util";

const AOC_URL = "https://adventofcode.com";
const taskPath = path.join(import.meta.dirname, "..", "tasks");
const inputPath = path.join(import.meta.dirname, "..", "inputs");

async function main() {
	if (!process.argv[2]) throw new Error("Must provide day as an argument");
	const day = Number(process.argv[2]);
	if (!Number.isInteger(day)) throw new Error(`day=${process.argv[2]} is not an integer`);
	if (day < 1 || day > 25)
		throw new Error(`day=${process.argv[2]} is not a valid day (must be 1-25)`);

	let input = "";
	const { AOC_SESSION } = process.env;
	if (AOC_SESSION) {
		const numbers = pkg.name.split(/[^\d]+/).filter((v) => v.length === 4 || v.length === 2);
		const currentYear = new Date().getFullYear();
		let year = `${currentYear}`;
		if (numbers.filter((v) => v.length === 4).length === 1)
			year = numbers.filter((v) => v.length === 4)[0];
		else if (numbers.filter((v) => v.length === 2).length === 1)
			year = `${year.slice(0, 2)}${numbers.filter((v) => v.length === 2)[0]}`;
		else console.error(`Could not find year in package name "${pkg.name}"`);

		if (Number(year) > currentYear || Number(year) < 2015)
			console.error(`Year ${year} may be out of bounds for advent of code`);

		try {
			console.log(`Fetching input for day ${day} year ${year}`);
			const res = await fetch(`${AOC_URL}/${year}/day/${day}/input`, {
				method: "GET",
				headers: new Headers({ Cookie: `session=${AOC_SESSION}` }),
			});
			if (res.status !== 200) throw res;
			input = await res.text();
		} catch (e) {
			console.error(`Failed to fetch input from ${AOC_URL}`);
			if (e instanceof Response)
				console.error(`Server responded with code ${e.status}:\n${await e.text()}`);
		}
	}

	fs.writeFile(path.join(taskPath, `${day}-1.ts`), TASK_CONTENT);
	fs.writeFile(path.join(taskPath, `${day}-2.ts`), TASK_CONTENT);
	fs.writeFile(path.join(inputPath, `${day}.txt`), input);
	console.log("Created files for day", day);
}

main();
