const { app, protocol, session, webContents } = require("electron");
const fs = require("fs");
const path = require("path");

let chokidar;
try {
    chokidar = require("chokidar");
} catch(e) {}

const requests = {};

protocol.registerStandardSchemes(["file"]);

function updateCSS(filePath, text) {
    const webContent = webContents.fromId(requests[filePath].id);
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
            const url = request.url;
            const filePath = request.url.replace(/^file:\/\//, "");
            const buffer = fs.readFileSync(filePath);

            if (!url.endsWith(".js") && request.headers.Accept === "*/*") {
                const text = buffer.toString();

                callback({
                    mimeType: "application/javascript",
                    data: Buffer.from(`export default \`${text}\`;`)
                });

                updateCSS(filePath, text);

                return;
            }

            callback(buffer);
        });

        let watcher;

        if (chokidar) {
            watcher = chokidar.watch(initialPath, {
                ignored: /(^|[\/\\])\..|.*node_modules.*/
            }).on("ready", () => {
                watcher.on("all", (event, filePath, stat) => {
                    filePath = path.resolve(filePath);
                    const text = fs.readFileSync(filePath).toString();

                    switch (event) {
                        case "add":
                            break;
                        case "change":
                            updateCSS(filePath, text);
                            break;
                        case "unlink":
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

