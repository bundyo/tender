import $import from "./$import.js";
import "./test.css";
import compiler from "//vue-template-compiler";

const compiled = compiler.compileToFunctions(`<div><button-counter></button-counter><test-el></test-el></div>`);

import Vue from "//vue";
import api from "//vue-hot-reload-api";

api.install(Vue);

import "./test.js";

Vue.component(
  "test-el",
  () => $import("./test2.js")
);

new Vue({
    el: '#app',

    ...compiled
});

document.querySelector("button").addEventListener("click", (e) => {
    e.preventDefault();
    $import("./test2.css");
});
