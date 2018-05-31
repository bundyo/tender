import $import from "./$import.js";
import "./test.css";

import Vue from "//vue";

import "./test.js";

Vue.component(
  "test-el",
  () => $import("./test2.js")
);

new Vue({
    el: '#app',

    template: `<div><button-counter></button-counter><test-el></test-el></div>`
});

document.querySelector("button").addEventListener("click", (e) => {
    e.preventDefault();
    $import("./test2.css");
});
