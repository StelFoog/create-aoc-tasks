import { setInput } from "./inputManager.js";
import { getInput, getTask, getTaskFile, taskFinder } from "./util.js";

const [_run, _filePath, tempTask = "latest", tempUseExample = "false"] = process.argv;

const taskSelection = taskFinder(tempTask);

const task = await getTask(taskSelection);

const input = await getInput(
	Number(task.split("-")[0]),
	["t", "true", "y", "yes"].includes(tempUseExample)
);
setInput(input.trim());

await import(getTaskFile(task));