import * as React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Link, Route } from "react-router-dom";
import { createStore, Store } from "redux";

import Index from "./apps/index";
import Upload from "./apps/upload";
import { Istate, reducer } from "./redux/reducers";

export default class App extends React.Component {
    public render() {
        return (
            <BrowserRouter>
              <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                  <div className="container">
                    <Link to="/" className="navbar-brand">Shogi Dataset</Link>
                    <div className="collapse navbar-collapse">
                      <ul className="navbar-nav">
                        <li className="nav-item">
                          <Link to="/upload" className="nav-link">Upload</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </nav>
                <div className="container py-md-3">
                  <div>
                    <Route exact path="/" component={Index} />
                    <Route exact path="/upload" render={() => {
                        const store: Store<Istate> = createStore(reducer);
                        return <Provider store={store}><Upload /></Provider>;
                    }} />
                  </div>
                </div>
              </div>
            </BrowserRouter>
        );
    }
}
