import { existsSync, statSync } from "fs";
import { readFile, readdir } from "fs/promises";
import path from "path";
import type { Task, TaskSelection } from "./types";

export function taskFinder(task: string): TaskSelection {
	if (["l", "latest"].includes(task)) return "latest";
	if (!task.match(/^\d{1,2}(\-[12])?$/)) throw `"${task}" is not valid as a task identifier`;

	const [day, part] = task.split("-").map(Number);
	if (day > 25 || day < 1) throw `"${day}" is not a valid AoC day`;

	return (part ? `${day}-${part}` : `${day}`) as Task;
}

const INPUTS_FOLDER = path.join(process.cwd(), "inputs");
const DEFAULT_INPUT_FILE = path.join(INPUTS_FOLDER, "default.txt");
const EXAMPLE_FILE = path.join(INPUTS_FOLDER, "example.txt");

export async function getInput(day: number, useExample = false): Promise<string> {
	if (useExample) {
		if (!existsSync(EXAMPLE_FILE)) throw "The example file doesn't exist";
		return readFile(EXAMPLE_FILE).then((res) => res.toString());
	}
	const dayFile = path.join(INPUTS_FOLDER, `${day}.txt`);

	if (existsSync(dayFile)) return readFile(dayFile).then((res) => res.toString());
	if (existsSync(DEFAULT_INPUT_FILE))
		return readFile(DEFAULT_INPUT_FILE).then((res) => res.toString());

	throw `Neither day (${day}) nor default input file exists`;
}

const TASK_FOLDER = path.join(process.cwd(), "tasks");

export async function getAllTasks() {
	if (!existsSync(TASK_FOLDER)) throw "Task folder does not exist";

	const files = await readdir(TASK_FOLDER);

	return files
		.map((file) => ({ file, ...path.parse(file) }))
		.filter(({ file, name, ext }) => {
			if (!name.match(/^\d{1,2}\-[12]$/)) return false;
			if (ext !== ".ts") return false;

			if (statSync(path.join(TASK_FOLDER, file)).size <= TASK_CONTENT.length) return false;

			const day = Number(name.split("-")[0]);
			return 1 <= day && day <= 25;
		})
		.map(({ name }) => name as Task)
		.sort((a, b) => {
			const [dayA, partA] = a.split("-").map(Number);
			const [dayB, partB] = b.split("-").map(Number);
			return dayA > dayB ? 1 : dayA < dayB ? -1 : partA - partB;
		});
}

export async function getTask(target: TaskSelection): Promise<Task> {
	const allTasks = await getAllTasks();
	if (!allTasks.length) {
		console.log("No tasks to run were found.");
		process.exit(1);
	}

	if (target === "latest") return allTasks[allTasks.length - 1];

	const dayTarget = !target.includes("-");
	const task = allTasks.reverse().find((task) => {
		if (dayTarget) return target === task.split("-")[0];
		return target === task;
	});

	if (!task) {
		console.error(`No task found for the target "${target}"`);
		process.exit(1);
	}
	return task;
}

export function getTaskFile(task: Task): string {
	return path.join(TASK_FOLDER, `${task}.ts`);
}

export const TASK_CONTENT = 'import { input } from "../src/inputManager";\n';
