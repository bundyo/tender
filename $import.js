// Based on dynamic-import-polyfill by uupaa
// https://github.com/uupaa/dynamic-import-polyfill/

const a = document.createElement("a");

let counter = 0;

function absoluteURL(url) {
    a.setAttribute("href", url);
    return a.cloneNode(false).href;
}

export function $import(url) {
    return new Promise((resolve, reject) => {
        counter++;

        const head = document.head;
        const script = document.createElement("script");

        script.defer = "defer";
        script.type = "module";
        script.onerror = (e) => {
            reject(e);

            URL.revokeObjectURL(script.src);
            script.remove();
        };
        script.onload = () => {
            resolve(window[`__module__${counter}`]);

            delete window[`__module__${counter}`];
            URL.revokeObjectURL(script.src);
            script.remove();
        };

        const blob = new Blob(
            [`import * as m from "${absoluteURL(url)}"; window["__module__${counter}"] = m;`],
            {
                type: "text/javascript"
            });

        script.src = URL.createObjectURL(blob);

        head.appendChild(script);
    });
}

export default $import;
