import * as React from "react";
import * as ReactDOM from "react-dom";

import { App } from "./app";

window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(<App />, document.getElementById("main"));
});
