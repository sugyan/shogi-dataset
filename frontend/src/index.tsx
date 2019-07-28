import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";

import App from "./App";
import { reducer } from "./redux/reducers";

import "bootstrap/dist/css/bootstrap.css";

ReactDOM.render(
    (
      <Provider store={createStore(reducer)}>
        <App />
      </Provider>
    ),
    document.getElementById("root")
);
