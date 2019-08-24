import { IncomingMessage, ServerResponse } from "http";

const PING_INTERVAL = 10000;

export class SSE {
    connections: Set<ServerResponse>;
    pinger: NodeJS.Timeout;
    constructor() {
        this.connections = new Set();
        this.pinger = setInterval(() => {
            this.sendAll("ping");
        }, PING_INTERVAL);
    }
    middleware() {
        return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
            if (req.url === "/sse") {
                res.setHeader("connection", "keep-alive");
                res.setHeader("cache-control", "no-cache");
                res.setHeader("content-type", "text/event-stream");
                req.on("close", () => {
                    this.connections.delete(res);
                    res.end();
                    console.log(`sse connections ${this.connections.size}`);
                });
                this.connections.add(res);
                this.send(res, "connect");
                console.log(`sse connections ${this.connections.size}`);
            } else {
                next();
            }
        }
    }
    stop() {
        clearInterval(this.pinger);
        for (const res of Array.from(this.connections.values())) {
            console.log("disconnect");
            this.send(res, "disconnect");
            res.end();
            this.connections.delete(res);
        }
    }
    send(res: ServerResponse, event: string, data: any = {}) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
    sendAll(event: string, data: any = {}) {
        this.connections.forEach((res) => {
            this.send(res, event, data);
        });
    }
    reload(change: string, filename: string) {
        this.sendAll("reload", { change, filename });
        console.log("send reload!");
    }
    eval(code: string) {
        this.sendAll("eval", code);
    }
}
