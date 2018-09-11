import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, Store } from "redux";

import Index from "./apps/index";
import Upload from "./apps/upload";
import { Istate, reducer } from "./redux/reducers";

const apps: any = {
    index:  Index,
    upload: Upload,
};

window.addEventListener("DOMContentLoaded", () => {
    const store: Store<Istate> = createStore(reducer);
    document.querySelectorAll(".react-root").forEach((e: Element) => {
        const App = apps[e.id];
        if (App) {
            ReactDOM.render(
                <Provider store={store}><App /></Provider>,
                e,
            );
        }
    });
});
