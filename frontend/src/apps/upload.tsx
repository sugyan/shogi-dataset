import * as React from "react";

import Canvas from "../components/canvas";
import Divide from "../components/divide";
import Perspective from "../components/perspective";

export default class Upload extends React.Component {
    public render() {
        return (
            <div className="row">
              <div className="col-8">
                <Canvas size={1024} />
              </div>
              <div className="col-4">
                <Perspective size={96 * 9} />
                <hr />
                <Divide size={96} />
              </div>
            </div>
        );
    }
}
