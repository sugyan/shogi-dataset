import * as tf from "@tensorflow/tfjs";
import { loadFrozenModel } from "@tensorflow/tfjs-converter";
import * as React from "react";
import { connect } from "react-redux";
import { BrowserRouter, Link, Route } from "react-router-dom";
import { Dispatch } from "redux";

import Index from "./apps/index";
import Upload from "./apps/upload";
import { CommonAction, loadModelAction } from "./redux/actions/common";

interface IdispatchProps {
    loadModel: (model: tf.FrozenModel) => CommonAction;
}

type Props = IdispatchProps;

class App extends React.Component<Props> {
    public componentWillMount() {
        const { loadModel } = this.props;
        const MODEL_URL = "/static/data/tensorflowjs_model.pb";
        const WEIGHTS_URL = "/static/data/weights_manifest.json";
        loadFrozenModel(
            MODEL_URL, WEIGHTS_URL,
        ).then((model: tf.FrozenModel) => {
            loadModel(model);
        }).catch((err: Error) => {
            window.console.error(err);
        });
    }
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
                    <Route exact path="/upload" component={Upload} />
                  </div>
                </div>
              </div>
            </BrowserRouter>
        );
    }
}
export default connect(
    (state) => state,
    (dispatch: Dispatch): IdispatchProps => {
        return {
            loadModel: (model: tf.FrozenModel): CommonAction => dispatch(loadModelAction(model)),
        };
    },
)(App);
