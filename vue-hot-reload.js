module.exports = {
    install() {
        return `
            const a = document.createElement("a");
            
            let counter = 0;
            
            function absoluteURL(url) {
                a.setAttribute("href", url);
                return a.cloneNode(false).href;
            }
            
            function $import(url) {
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
                        resolve(window[\`__module__\${counter}\`]);
            
                        delete window[\`__module__\${counter}\`];
                        URL.revokeObjectURL(script.src);
                        script.remove();
                    };
            
                    const blob = new Blob(
                        [\`import * as m from "\${absoluteURL(url)}"; window["__module__\${counter}"] = m;\`],
                        {
                            type: "text/javascript"
                        });
            
                    script.src = URL.createObjectURL(blob);
            
                    head.appendChild(script);
                });
            }
            
            $import("//Vue").then((Vue) => {
                Vue = Vue.default;

                $import("//vue-hot-reload-api").then((api) => {
                    api = api.default;
                
                    api.install(Vue);
                    
                    window.__api__ = api;
                    
                    const __component__ = Vue.component;
                    
                    Vue.component = function () {
                        __component__.call(this, ...arguments);
                    }        
                });
            });
        `;
    }
};
