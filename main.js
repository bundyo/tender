const { app, BrowserWindow } = require("electron");
const tender = require("./tender");

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    tender.init({
        alias: {
            vue: "dist/vue.esm.js"
        },
        plugins: {
            vue: "./vue-hot-reload.js"
        }
    });

    const win = new BrowserWindow();

    win.openDevTools();

    win.loadFile("index.html");
});
