import template from "./test2.html"

export default {
    name: "test-el",

    options: {
        data: function () {
            return {
                count: 0
            }
        },

        template
    }
};
