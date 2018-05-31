const { app, protocol, session, webContents } = require("electron");
const fs = require("fs");
const path = require("path");

let chokidar;
try {
    chokidar = require("chokidar");
} catch(e) {}

const requests = {};
const plugins = {};
const transforms = {
    "vue-hot-reload-api": {},
    "vue-template-compiler": {
        entry: "build.js"
    }
};

protocol.registerStandardSchemes(["file"]);

function executeInWebContent(id, script) {
    if (!id || !script) {
        return;
    }

    const webContent = webContents.fromId(id);

    webContent && webContent.executeJavaScript(script);
}

function updateCSS(filePath, text) {
    if (filePath.endsWith(".css")) {
        executeInWebContent(requests[filePath] && requests[filePath].id, `
            styleTag = document.documentElement.querySelector(${`'style[url="${filePath}"]'`});
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
    init(options = {}) {
        options = Object.assign({
            path: ".",
            alias: {},
            plugins: {}
        }, options);

        if (options.plugins) {
            Object.entries(options.plugins).forEach((entry) => {
                plugins[entry[0]] = require(entry[1]);
            });
        }

        session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
            const filePath = details.url.replace(/^file:\/\//, "").replace(/\/$/, "");
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
                moduleName = filePath.replace(/\/$/, ""),
                transform = transforms[moduleName],
                alias = options.alias[moduleName],
                data, module;

            const isModule = filePath.endsWith("/") && !filePath.startsWith("/");

            if (isModule) {
                let pkg;

                if (alias) {
                    pkg = { module: alias };
                } else {
                    pkg = fs.readFileSync(path.resolve("node_modules", filePath, "package.json"), "utf8");

                    pkg = pkg && JSON.parse(pkg);
                }

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

                updateCSS(moduleName, text);

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

                if (plugins[moduleName]) {
                    executeInWebContent(requests[moduleName] && requests[moduleName].id, plugins[moduleName].install());
                }
            } else {
                callback(data);
            }
        });

        let watcher;

        if (chokidar) {
            watcher = chokidar.watch(options.path, {
                ignored: /(^|[\/\\])\..|.*node_modules.*/
            }).on("ready", () => {
                watcher.on("all", (event, filePath, stat) => {
                    filePath = path.resolve(filePath).replace(/\/$/, "");
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

