module.exports = {
    name: "vue-hot-reload-api",

    install() {
        return `       
        <script type="module" id="${this.name}" defer="false" async="false">     
            import api from "//${this.name}";
            import Vue from "//Vue";

            api.install(Vue);
            
            window.__vue_hot_reload_api__ = api;

            const __component__ = Vue.component;

            Vue.component = function (name, options) {
                if (typeof options !== "function") {
                    api.createRecord(name, options);
                }

                __component__.call(this, ...arguments);
            }
            
            setTimeout(() => document.querySelector("#${this.name}").remove(), 0);
        </script>`;
    }
};
