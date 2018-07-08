import * as React from "react";

import { Canvas } from "./components/canvas";
import { Navbar } from "./components/navbar";

export class App extends React.Component<{}, {}> {
    render() {
        return (
            <div>
              <Navbar />
              <div className="container">
                <div className="row">
                  <div className="col-6">
                    <Canvas />
                  </div>
                </div>
              </div>
            </div>
        );
    }
}
