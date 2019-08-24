# Readme

*Automatic reload on client and server source code changes.*

Web development can be made more pleasant by automatic reloading of client and server code.
In this repository its implemented using the node apis to see how this can be handled without dependencies.
Care has been taken to ensure graceful shutdown of connections and processes.

## Refreshing client assets

At startup the server starts monitoring the `public` directory for changes using [fs.watch](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener).
When a change is detected the connected browser sessions are informed to reload their page.
[Server-send events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
are used because they are available in most [browsers](https://caniuse.com/#feat=eventsource).
The browser connects to the `/sse` endpoint that keeps the connection open and from which it will receive events from the server.
The `server.ts` will gracefully close its connections with browsers once it shuts down.

## Reloading server source

The script `master.ts` watches for changes in the `build` directory and performs a restart of `server.ts`.
The `master.ts` and `server.ts` run in separate node environments and the `master.ts` manages the automatic reloading.
Any changes in the `master.ts` source itself requires a manual restart.
If the server unexpectedly stops with an exitcode other than zero, the master will first wait for changes in the build directory.
Because the crash can be caused by a syntax error or logic error in the source code.
When the `master.ts` process itself is killed it will also shut down its `server.ts` child process.
Use a regular `kill` to terminate the process because `kill -9` will result in an orphaned child process that stills listens on the http port.

## Development

```bash
# watch typescript sources and compile to build
tsc --watch
# start the master that will start the server
npm run dev
```

## References

- [Using NodeJS for uni-directional event streaming (SSE)](https://medium.com/@moinism/using-nodejs-for-uni-directional-event-streaming-sse-c80538e6e82e)
- [fs.watch](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener)
- [child_process.fork](https://nodejs.org/docs/latest/api/child_process.html#child_process_child_process_fork_modulepath_args_options)
- [Signal (IPC)](https://en.wikipedia.org/wiki/Signal_(IPC))
