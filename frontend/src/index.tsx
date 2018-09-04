import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, Store } from "redux";

import App from "./app";
import { Istate, reducer } from "./redux/reducers";

window.addEventListener("DOMContentLoaded", () => {
    const store: Store<Istate> = createStore(reducer);
    ReactDOM.render(
        <Provider store={store}>
          <App />
        </Provider>,
        document.getElementById("main"),
    );
});
