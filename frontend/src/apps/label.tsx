import { DateTime } from "luxon";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { Iparameter, predictResultString, queryString } from "../utils/common";
import { labels, labelStringMap, numbers } from "../utils/piece";
import WorkerProxy, { IpredictResult } from "../utils/worker-proxy";

interface Iimage {
    id: string;
    image_url: string;
    created_at: string;
    updated_at: string;
    predict_result?: IpredictResult[];
}

interface IimagesResult {
    images: Iimage[];
    cursor: string;
}

interface IlabelState {
    images: Iimage[];
    total?: number;
    cursor: string;
}

type IlabelProps = RouteComponentProps<{ label: string }>;

class Label extends React.Component<IlabelProps, IlabelState> {
    public constructor(props: IlabelProps) {
        super(props);
        this.state = {
            cursor: "",
            images: [],
        };
    }
    public componentDidMount() {
        const { match } = this.props;
        const params: Iparameter = { label: match.params.label };
        // fetch images
        fetch(
            `/api/images?${queryString(params)}`,
        ).then((res: Response) => {
            return res.json();
        }).then((results: IimagesResult) => {
            this.setState({
                cursor: results.cursor,
                images: results.images,
            });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
        // fetch index to get total numbers
        fetch(
            "/api/index",
        ).then((res: Response) => {
            return res.json();
        }).then((total: numbers) => {
            this.setState({ total: total[match.params.label as labels] });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { match } = this.props;
        const { total, images, cursor } = this.state;
        let totalLabel: React.ReactNode;
        if (total !== undefined) {
            totalLabel = (
                <label>全 {total} 件</label>
            );
        }
        const labelName: string = labelStringMap[match.params.label as labels];
        const imageList = images.map((v: Iimage) => {
            const format: string = "yyyy-LL-dd TT";
            let predict: React.ReactNode;
            if (v.predict_result) {
                predict = <pre>{predictResultString(v.predict_result)}</pre>;
            } else {
                predict = (
                    <button className="btn text-muted" onClick={this.onClickPredict.bind(this, v)}>
                      predict
                    </button>
                );
            }
            return (
                <tr key={v.id}>
                  <td>
                    <Link to={`/image/${v.id}`}>
                      <img src={v.image_url} className="img-thumbnail" />
                    </Link>
                  </td>
                  <td className="align-middle">{predict}</td>
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
    private onClickMore() {
        const { match } = this.props;
        const { cursor } = this.state;
        const params = {
            cursor,
            label: match.params.label,
        };
        fetch(
            `/api/images?${queryString(params)}`,
        ).then((res: Response) => {
            return res.json();
        }).then((results: IimagesResult) => {
            const { images } = this.state;
            this.setState({
                cursor: results.cursor,
                images: images.concat(results.images),
            });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    private onClickPredict(image: Iimage) {
        const { images } = this.state;
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        const img: HTMLImageElement = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            canvas.height = img.height;
            canvas.width  = img.width;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            WorkerProxy.predict([imageData]).then((results: IpredictResult[][]) => {
                images.forEach((e: Iimage) => {
                    if (e.id === image.id) {
                        e.predict_result = results[0];
                    }
                });
                this.setState({ images });
            });
        };
        img.src = image.image_url;
    }
}
export default withRouter(Label);
