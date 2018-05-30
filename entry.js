import $import from "./$import.js";
import test from "./test.js";
import "./test.css";

import Vue from "vue";

document.body.style.background = test.isTest ? "green" : "red";

document.querySelector("button").addEventListener("click", (e) => {
    e.preventDefault();
    $import("./test2.css");

    $import("./test2.js")
        .then((module) => {
            console.log(module.default);
            console.log(module.isTest2);
        });
});
