# Advent of Code {{year}}

Solutions to Advent of Code {{year}} using {{lang}}.

<sub><sup>Project was bootstaped using `create-aoc-tasks`.</sup></sub>

## Managing tasks

Tasks are stored in the format of `day-task.ts` within the tasks folder, e.g. for day 12 task 1 the file would be `tasks/12-1.ts`.

`{{packageManagerRun}} make-day [day]` can be used to automatically create task and input files for the provided day. If an `AOC_SESSION` variable is provided into `.env` your input will also be fetched.

## Running

Install dependencies: `{{packageManager}} install`

Any task can be run using `{{packageManagerRun}} task` which by default runs the last task (can also be done explicitly with `{{packageManagerRun}} task latest`). Alternativly a day `{{packageManagerRun}} task [day]` (which will try to run part 2 first and part 1 secondly), or a specific task (`{{packageManagerRun}} task [day-part]`).

Tasks try to get input specific to that day (e.g for task `4-1`, it will get `inputs/4.txt`) or, if it doesn't exist, the default input (`inputs/default.txt`).

It's also possible to use example inputs by including `true` after the task to be run (e.g. `{{packageManagerRun}} task latest true`), which work the same as regular inputs, but placed within the `example.txt` file in the inputs folder.

## Progress

- [ ] Day 1
- [ ] Day 2
- [ ] Day 3
- [ ] Day 4
- [ ] Day 5
- [ ] Day 6
- [ ] Day 7
- [ ] Day 8
- [ ] Day 9
- [ ] Day 10
- [ ] Day 11
- [ ] Day 12
- [ ] Day 13
- [ ] Day 14
- [ ] Day 15
- [ ] Day 16
- [ ] Day 17
- [ ] Day 18
- [ ] Day 19
- [ ] Day 20
- [ ] Day 21
- [ ] Day 22
- [ ] Day 23
- [ ] Day 24
- [ ] Day 25
