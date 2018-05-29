const { app, BrowserWindow } = require("electron");
const tender = require("./tender");

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    tender.init();

    const win = new BrowserWindow();

    win.loadFile("index.html");
});
