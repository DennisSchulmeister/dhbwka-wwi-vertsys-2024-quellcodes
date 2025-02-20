#!/usr/bin/env node

let nonEmptyLines = [];

process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
    lines = chunk.split("\n");

    for (let line of lines) {
        if (!line) continue;
        nonEmptyLines.push(line);
    }
});

process.stdin.on("end", () => {
    nonEmptyLines.sort();
    nonEmptyLines.forEach(console.log);
});