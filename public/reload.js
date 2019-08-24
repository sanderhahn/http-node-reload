const eventSource = new EventSource("/sse");

function data(event) {
    return JSON.parse(event.data);
}

eventSource.addEventListener("connect", (event) => {
    console.log("connect", data(event));
});

eventSource.addEventListener("ping", (event) => {
    console.log("ping", data(event));
});

eventSource.addEventListener("eval", (event) => {
    const code = data(event);
    console.log(code);
    eval(code);
});

eventSource.addEventListener("reload", (event) => {
    console.log("reload", data(event));
    eventSource.close();
    window.location.reload();
});

eventSource.addEventListener("disconnect", (event) => {
    console.log("disconnect", data(event));
    eventSource.close();
});

eventSource.addEventListener("message", (event) => {
    console.log("message", data(event));
});

eventSource.addEventListener("error", (error) => {
    console.error(error);
});

window.addEventListener("beforeunload", (event) => {
    console.log("unload");
    eventSource.close();
});
