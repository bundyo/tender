const { protocol, session, webContents } = require("electron");
const fs = require("fs");

const requests = {};

protocol.registerStandardSchemes(["file"]);

module.exports = {
    init() {
        session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
            requests[details.url] = {
                id: details.webContentsId

            };

            callback({ cancel: false });
        });

        protocol.unregisterProtocol("file");
        protocol.registerBufferProtocol("file", (request, callback) => {
            const url = request.url;
            const buffer = fs.readFileSync(request.url.replace(/^file:\/\//, ""));

            if (!url.endsWith(".js") && request.headers.Accept === "*/*") {
                const text = buffer.toString();

                callback({
                    mimeType: "application/javascript",
                    data: Buffer.from(`export default \`${text}\`;`)
                });

                const webContent = webContents.fromId(requests[url].id);
                const selector = `'style[url="${url}"]'`;

                if (webContent && url.endsWith(".css")) {
                    webContent.executeJavaScript(`
    styleTag = document.documentElement.querySelector(${selector});
    styleElement = document.createElement("style");
    
    styleElement.url = \`${url}\`;
    styleElement.textContent = \`${text}\`;
    
    if (styleTag) {
        styleTag.replaceWith(styleElement);
    } else {
        document.head.appendChild(styleElement);
    }
`);
                }

                return;
            }

            callback(buffer);
        });
    }
};

