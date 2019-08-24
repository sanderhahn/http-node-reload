import { ChildProcess, fork } from "child_process";
import { watch } from "fs";
import { basename } from "path";

process.on("uncaughtException", (error: Error) => {
    console.log("Uncaught Exception:");
    console.log(error.stack);
    cleanup();
    process.exit(1);
});

console.log(`Master (pid = ${process.pid})`);

process.once("SIGINT", () => {
    console.log(`SIGINT in ${basename(__filename)}`);
    cleanup();
    // process.exitCode = 128 + 2;
});

process.once("SIGTERM", () => {
    console.log(`SIGTERM in ${basename(__filename)}`);
    cleanup();
    // process.exitCode = 128 + 15;
});

function cleanup() {
    if (srcWatcher) {
        srcWatcher.close();
    }
    if (server) {
        // removes the close/restart handler
        server.removeAllListeners();
        server.kill();
    }
}

function restart() {
    console.log("Starting...");
    server = fork("build/server.js", process.argv);
    server.once("close", (code, signal) => {
        console.log(`server stopped with code = ${code} signal = ${signal}`);
        if (code === 0 || signal === "SIGTERM") {
            restart();
        } else {
            server = null;
        }
    });
}

let server: ChildProcess | null = null;
restart();

const srcWatcher = watch("./build", { recursive: true }, (change, filename) => {
    console.log("Change detected...");
    if (server) {
        server.kill();
    } else {
        restart();
    }
});
