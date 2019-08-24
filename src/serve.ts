import { IncomingMessage, ServerResponse } from "http";
import { resolve, extname } from "path";
import { createReadStream, stat, Stats } from "fs";
import { parse } from "url";
import { createHash } from "crypto";

// https://www.freeformatter.com/mime-types-list.html
export const mimes: { [key: string]: string } = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".txt": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".json": "application/json",
}

function etag(stat: Stats) {
    const hash = createHash("md5");
    hash.write(`${stat.size}${stat.mtime}`);
    return hash.digest().toString("hex");
}

function if_match_tag(req: IncomingMessage, tag: string) {
    const if_none_match = req.headers["if-none-match"];
    return if_none_match === tag;
}

function if_not_modified_since(req: IncomingMessage, stats: Stats) {
    const if_modified_since = req.headers["if-modified-since"];
    if (if_modified_since === undefined) {
        return false;
    }
    var mtime_without_millis = stats.mtime.getTime();
    mtime_without_millis -= (mtime_without_millis % 1000);
    const if_modified_since_date = new Date(if_modified_since);
    return mtime_without_millis <= if_modified_since_date.getTime();
}

function sendFile(req: IncomingMessage, res: ServerResponse, filename: string, stats: Stats) {
    const tag = etag(stats);
    if (if_match_tag(req, tag) || if_not_modified_since(req, stats)) {
        res.writeHead(304);
        res.end();
        return;
    }
    res.setHeader("Content-Length", stats.size);
    res.setHeader("ETag", tag);
    res.setHeader("Last-Modified", stats.mtime.toUTCString());
    const s = createReadStream(filename);
    s.pipe(res, { end: true });
}

export function serve(directory: string) {
    directory = resolve(directory);
    return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === undefined) {
            next();
            return;
        }
        const parsed = parse(req.url);
        const pathname = parsed.pathname || "/";
        const filename = resolve(directory, pathname.substring(1));
        if (!filename.startsWith(directory)) {
            res.writeHead(404);
            res.end("Not Found\n");
            return;
        }
        const ext = extname(pathname);
        const mime = mimes[ext];
        if (mime) {
            res.setHeader("Content-Type", mime);
        }
        stat(filename, (err, stats) => {
            if (err) {
                next();
                return;
            }
            if (stats.isDirectory()) {
                const index = `${filename}/index.html`;
                stat(index, (err, stats) => {
                    if (err) {
                        next();
                        return;
                    }
                    sendFile(req, res, index, stats);
                });
                return;
            }
            sendFile(req, res, filename, stats);
        });
    }
}
