import * as React from "react";

import Canvas from "./components/canvas";
import Divide from "./components/divide";
import Navbar from "./components/navbar";
import Perspective from "./components/perspective";

export default class App extends React.Component {
    public render() {
        return (
            <div>
              <Navbar />
              <div className="container py-md-3">
                <div className="row">
                  <div className="col-8">
                    <Canvas size={1024} />
                  </div>
                  <div className="col-4">
                    <Perspective size={96 * 9} />
                    <Divide />
                  </div>
                </div>
              </div>
            </div>
        );
    }
}
