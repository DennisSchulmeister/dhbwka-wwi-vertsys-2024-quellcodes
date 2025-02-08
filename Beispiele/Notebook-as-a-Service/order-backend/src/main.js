import controllers   from "./controllers/index.js";
import {startServer} from "@dschulmeis/naas-common/src/server.js";

import path          from "node:path";
import url           from "node:url";

const sourceDir = path.dirname(url.fileURLToPath(import.meta.url));
const staticDir = path.join(sourceDir, "..", "static");

await startServer({
    asciiArt: [
        "┳┓     ┓     ┓            ┏┓      ▪    ",
        "┃┃┏┓╋┏┓┣┓┏┓┏┓┃┏  ┏┓┏  ┏┓  ┗┓┏┓┏┓┓┏┓┏┏┓▪",
        "┛┗┗┛┗┗ ┗┛┗┛┗┛┛┗  ┗┻┛  ┗┻  ┗┛┗ ┛ ┗┛┗┗┗ ▪",
        "┏┓  ┏          ┳┓   ┓      ┓",
        "┣┫┓┏╋╋┏┓┏┓┏┓┏━━┣┫┏┓┏┃┏┏┓┏┓┏┫",
        "┛┗┗┻┛┗┛ ┗┻┗┫┛  ┻┛┗┻┗┛┗┗ ┛┗┗┻",
        "           ┛                ",
    ],
    staticDir:   staticDir,
    controllers: controllers,
});