import React, { Dispatch, useEffect } from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Row, Col } from "reactstrap";

import Canvas from "./upload/Canvas";
import Perspective from "./upload/Perspective";
import Divide from "./upload/Divide";
import { AppState } from "../redux/store";
import { UploadAction, loadImage, updatePoints, updateImageData } from "../redux/actions";
import { User, UserRole } from "../redux/reducers";

interface StateProps {
    user?: User;
}

interface DispatchProps {
    loadImage: (image?: HTMLImageElement) => void;
    updateImageData: (imageData?: ImageData) => void;
    updatePoints: (points: number[]) => void;
}

type Props = StateProps & DispatchProps & RouteComponentProps<{}>;

const Upload: React.FC<Props> = (props: Props): JSX.Element | null => {
    const { user, history } = props;

    useEffect((): () => void => {
        return (): void => {
            const { loadImage, updateImageData, updatePoints } = props;
            loadImage(undefined);
            updateImageData(undefined);
            updatePoints([]);
        };
    });

    if (user && user.role !== UserRole.editor) {
        history.push("/");
        return null;
    }

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
};

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
            updateImageData: (imageData?: ImageData): void => {
                dispatch(updateImageData(imageData));
            },
            updatePoints: (points: number[]): void => {
                dispatch(updatePoints(points));
            },
        };
    },
)(Upload));
