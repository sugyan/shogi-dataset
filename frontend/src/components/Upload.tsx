import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Row, Col } from "reactstrap";

import Canvas from "./upload/Canvas";
import Perspective from "./upload/Perspective";
import Divide from "./upload/Divide";
import { AppState } from "../redux/store";
import { UploadAction, loadImage, updatePoints } from "../redux/actions";
import { User, UserRole } from "../redux/reducers";

interface StateProps {
    user?: User;
}

interface DispatchProps {
    loadImage: (image?: HTMLImageElement) => void;
    updatePoints: (points: number[]) => void;
}

type Props = StateProps & DispatchProps & RouteComponentProps<{}>;

class Upload extends React.Component<Props> {
    public componentWillMount(): void {
        const { user, history } = this.props;
        if (user && user.role !== UserRole.editor) {
            history.push("/");
        }
    }
    public componentWillReceiveProps(props: Props): void {
        const { user, history } = props;
        if (user && user.role !== UserRole.editor) {
            history.push("/");
        }
    }
    public componentWillUnmount(): void {
        const { loadImage, updatePoints } = this.props;
        loadImage(undefined);
        updatePoints([]);
    }
    public render(): JSX.Element {
        return (
          <Row>
            <Col xs="8">
              <Canvas size={1024} />
            </Col>
            <Col xs="4">
              <Perspective size={96 * 9} />
              <hr />
              <Divide size={96} />
            </Col>
          </Row>
        );
    }
}

export default withRouter(connect(
    (state: AppState): StateProps => {
        return {
            user: state.userReducer.user,
        };
    },
    (dispatch: Dispatch<UploadAction>): DispatchProps => {
        return {
            loadImage: (image?: HTMLImageElement): void => {
                dispatch(loadImage(image));
            },
            updatePoints: (points: number[]): void => {
                dispatch(updatePoints(points));
            },
        };
    },
)(Upload));
