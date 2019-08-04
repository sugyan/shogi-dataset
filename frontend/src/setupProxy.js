/* eslint @typescript-eslint/no-var-requires: 0 */
const proxy = require("http-proxy-middleware");

module.exports = function(app) {
    app.use(proxy("/oauth2", { target: "http://localhost:8080/" }));
};
