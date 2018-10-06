import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, Store } from "redux";

import App from "./app";
import { reducer } from "./redux/reducer";

window.addEventListener("DOMContentLoaded", () => {
    const store: Store = createStore(reducer);
    ReactDOM.render(
        <Provider store={store}><App /></Provider>,
        document.getElementById("app"),
    );
});
