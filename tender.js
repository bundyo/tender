const { app, protocol, session, webContents } = require("electron");
const fs = require("fs");
const path = require("path");

let chokidar;
try {
    chokidar = require("chokidar");
} catch(e) {}

const requests = {};

const transforms = {
    "vue-hot-reload-api": {},
    "vue-template-compiler": {
        entry: "build.js"
    }
};

protocol.registerStandardSchemes(["file"]);

function updateCSS(filePath, text) {
    const webContent = requests[filePath] && webContents.fromId(requests[filePath].id);
    const selector = `'style[url="${filePath}"]'`;

    if (webContent && filePath.endsWith(".css")) {
        webContent.executeJavaScript(`
            styleTag = document.documentElement.querySelector(${selector});
            styleElement = document.createElement("style");
            
            styleElement.url = \`${filePath}\`;
            styleElement.textContent = \`${text}\`;
            
            if (styleTag) {
                styleTag.replaceWith(styleElement);
            } else {
                document.head.appendChild(styleElement);
            }
        `);
    }
}

module.exports = {
    init(initialPath = ".") {
        session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
            const filePath = details.url.replace(/^file:\/\//, "");
            const request = requests[filePath];
            const id = details.webContentsId;

            if (!request) {
                requests[filePath] = {
                    id,
                    contents: [id]
                };
            } else {
                if (request.contents.indexOf(id) === -1) {
                    request.contents.push(id);
                }
            }

            callback({ cancel: false });
        });

        protocol.unregisterProtocol("file");
        protocol.registerBufferProtocol("file", (request, callback) => {
            let filePath = request.url.replace(/^file:\/\//, ""),
                moduleName = filePath.slice(0, -1),
                transform = transforms[moduleName],
                data, module;

            const isModule = filePath.endsWith("/") && !filePath.startsWith("/");

            if (isModule) {
                let pkg = fs.readFileSync(path.resolve("node_modules", filePath, "package.json"), "utf8");

                pkg = pkg && JSON.parse(pkg);

                module = pkg.module ? pkg.module : transform && transform.entry ? transform.entry : pkg.main;

                filePath = path.resolve("node_modules", filePath, module);
            }

            data = fs.readFileSync(filePath);

            if (!filePath.endsWith(".js") && request.headers.Accept === "*/*") {
                const text = data.toString();

                callback({
                    mimeType: "application/javascript",
                    data: Buffer.from(`export default \`${text}\`;`)
                });

                updateCSS(filePath, text);

                return;
            }

            if (filePath.endsWith(".js")) {
                if (transform) {
                    const text = `let exports = {}; ${data.toString()}\nexport default exports;`;

                    callback({
                        mimeType: "application/javascript",
                        data: Buffer.from(text)
                    });
                } else {
                    callback({
                        mimeType: "application/javascript",
                        data
                    });
                }
            } else {
                callback(data);
            }
        });

        let watcher;

        if (chokidar) {
            watcher = chokidar.watch(initialPath, {
                ignored: /(^|[\/\\])\..|.*node_modules.*/
            }).on("ready", () => {
                watcher.on("all", (event, filePath, stat) => {
                    filePath = path.resolve(filePath);
                    if (requests[filePath]) {
                        const text = fs.readFileSync(filePath).toString();

                        switch (event) {
                            case "add":
                                break;
                            case "change":
                                updateCSS(filePath, text);
                                break;
                            case "unlink":
                        }
                    }
                });
            });
        }

        app.on("quit", () => {
            if (chokidar) {
                watcher.close();
            }
        })
    }
};

