import { DateTime } from "luxon";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { AppState } from "../redux/store";
import { User, UserRole } from "../redux/reducers";
import { ImagesResponse, NumbersResponse, ImageResponse } from "../utils/api";
import { queryString, predictResultString } from "../utils/functions";
import { labels, labelStringMap } from "../utils/piece";
import { PredictResult, Predictor } from "../utils/predictor";

interface Image extends ImageResponse {
    predict_result?: PredictResult[];
}

interface State {
    images: Image[];
    total?: number;
    cursor: string;
}

interface StateProps {
    user?: User;
}

type Props = StateProps & RouteComponentProps<{ label: string }>;

class Label extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            cursor: "",
            images: [],
        };
    }
    public componentDidMount(): void {
        const { match } = this.props;
        const params = { label: match.params.label };
        // fetch images
        fetch(
            `/api/images?${queryString(params)}`,
        ).then((res: Response): Promise<ImagesResponse> => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        }).then((results: ImagesResponse): void => {
            this.setState({
                cursor: results.cursor,
                images: results.images,
            });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
        // fetch index to get total numbers
        fetch(
            "/api/total",
        ).then((res: Response): Promise<NumbersResponse> => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        }).then((total: NumbersResponse): void => {
            this.setState({
                total: total[match.params.label as labels],
            });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
    public render(): JSX.Element {
        const { user, match } = this.props;
        const { total, images, cursor } = this.state;
        const totalLabel = total !== undefined
            ? <label>全 {total} 件</label>
            : null;
        const labelName: string = labelStringMap[match.params.label as labels];
        const imageList = images.map((v: Image): JSX.Element => {
            const format = "yyyy-LL-dd TT";
            const predict = v.predict_result
                ? <pre>{predictResultString(v.predict_result)}</pre>
                : (
                  <button className="btn text-muted" onClick={this.onClickPredict.bind(this, v)}>
                    predict
                  </button>
                );
            return (
              <tr key={v.id}>
                <td>
                  <Link to={`/image/${v.id}`}>
                    <img src={v.image_url} alt="piece img" className="img-thumbnail" />
                  </Link>
                </td>
                <td className="align-middle">{user && user.role === UserRole.editor && predict}</td>
                <td className="align-middle">{DateTime.fromISO(v.created_at).toFormat(format)}</td>
                <td className="align-middle">{DateTime.fromISO(v.updated_at).toFormat(format)}</td>
              </tr>
            );
        });
        let moreButton: React.ReactNode;
        if (cursor) {
            moreButton = (
              <button className="btn btn-outline-secondary float-right" onClick={this.onClickMore.bind(this)}>
                More
              </button>
            );
        }
        return (
          <React.Fragment>
            <h2>{labelName}</h2>
            {totalLabel}
            <table className="table table-sm table-hover">
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>{imageList}</tbody>
            </table>
            {moreButton}
          </React.Fragment>
        );
    }
    private onClickMore(): void {
        const { match } = this.props;
        const { cursor } = this.state;
        const params = {
            cursor,
            label: match.params.label,
        };
        fetch(
            `/api/images?${queryString(params)}`,
        ).then((res: Response): Promise<ImagesResponse> => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        }).then((results: ImagesResponse): void => {
            const { images } = this.state;
            this.setState({
                cursor: results.cursor,
                images: images.concat(results.images),
            });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
    private onClickPredict(image: Image): void {
        const { images } = this.state;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img: HTMLImageElement = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = (): void => {
            canvas.height = img.height;
            canvas.width  = img.width;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            if (!imageData) return;
            Predictor.predict([imageData]).then((results: PredictResult[][]): void => {
                images.forEach((e: Image): void => {
                    if (e.id === image.id) {
                        e["predict_result"] = results[0];
                    }
                });
                this.setState({ images });
            });
        };
        img.src = image.image_url;
    }
}

export default withRouter(
    connect(
        (state: AppState): StateProps => {
            return {
                user: state.userReducer.user,
            };
        },
    )(Label),
);
