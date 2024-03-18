import chalk           from "chalk";
import dotenv          from "dotenv";
import logging         from "logging";
import mqtt            from "mqtt";
import process         from "node:process";
import readlineSync    from "readline-sync";

const logger = logging.default(`player ${process.argv[2] || ""}`.trim());
dotenv.config();

logger.info(chalk.bold("Capture The Flag - Player"));