import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import Canvas from "../components/canvas";
import Divide from "../components/divide";
import Perspective from "../components/perspective";
import { clearStateAction, UploaderAction } from "../redux/actions/uploader";

interface IdispatchState {
    clearState: () => UploaderAction;
}

type Props = IdispatchState;

class Upload extends React.Component<Props> {
    public componentWillUnmount() {
        const { clearState } = this.props;
        clearState();
    }
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
export default connect(
    (state) => state,
    (dispatch: Dispatch) => {
        return {
            clearState: (): UploaderAction => dispatch(clearStateAction()),
        };
    },
)(Upload);
