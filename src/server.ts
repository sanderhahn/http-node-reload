const polka = require("polka");

import { SSE } from "./sse";
import { watch} from "fs";
import { IncomingMessage, ServerResponse, createServer } from "http";
import { basename } from "path";
import { serve, mimes } from "./serve";

const port = process.env.PORT || 4000;
const dev = process.env.NODE_ENV !== "production";

const sse = new SSE();

const publicWatcher = watch("public", { recursive: true }, (change, filename) => {
    sse.reload(change, filename);
});

function send(res: ServerResponse, status = 200, object: any) {
    res.writeHead(status, {
        "Content-Type": mimes.json,
    });
    res.end(JSON.stringify(object));
}

const server = createServer();

polka({ server })
    .use(
        sse.middleware(),
        serve("public"),
    )
    .get("/alert", (req: IncomingMessage, res: ServerResponse) => {
        sse.eval(`alert("Yolo!")`);
        send(res, 200, {ok: true});
    })
    .listen(port, () => {
        console.log(`Listening at http://localhost:${port}/ (pid = ${process.pid})`)
    });

process.once("SIGINT", () => {
    console.log(`SIGINT in ${basename(__filename)}`);
    // process.exitCode = 128 + 15;
    cleanup();
});
process.once("SIGTERM", () => {
    console.log(`SIGTERM in ${basename(__filename)}`);
    // process.exitCode = 128 + 15;
    cleanup();
});

function cleanup() {
    sse.stop();
    publicWatcher.close();
    server.close();
    process.removeAllListeners();
}
