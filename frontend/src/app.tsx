import * as React from "react";

import Canvas from "./components/canvas";
import Navbar from "./components/navbar";
import Perspective from "./components/perspective";

export class App extends React.Component<{}, {}> {
    public render() {
        return (
            <div>
              <Navbar />
              <div className="container">
                <div className="row">
                  <div className="col-8">
                    <Canvas size={1024} />
                  </div>
                  <div className="col-4">
                    <Perspective />
                  </div>
                </div>
              </div>
            </div>
        );
    }
}
