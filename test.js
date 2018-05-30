import Vue from "//vue";
import compiler from "//vue-template-compiler";

import template from "./test.html"

const component = Vue.component("button-counter", {
    data: function () {
        return {
            count: 0
        }
    },

    ...compiler.compileToFunctions(template)
});

export default component;
