import * as React from "react";
import { BrowserRouter, Link, Route } from "react-router-dom";

import Image from "./apps/image";
import Index from "./apps/index";
import Upload from "./apps/upload";

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
                    <Route exact path="/image/:id" component={Image} />
                    <Route exact path="/upload" component={Upload} />
                  </div>
                </div>
              </div>
            </BrowserRouter>
        );
    }
}
