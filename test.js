import Vue from "//vue";

import template from "./test.html"

const component = Vue.component("button-counter", {
    data: function () {
        return {
            count: 0
        }
    },

    template
});

export default component;
