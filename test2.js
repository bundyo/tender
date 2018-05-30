import compiler from "//vue-template-compiler";

import template from "./test.html"

export default {
    data: function () {
        return {
            count: 0
        }
    },

    ...compiler.compileToFunctions(template)
};
