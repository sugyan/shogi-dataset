import moment from "moment";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { Iparameter, queryString } from "../utils/common";
import { labels, labelStringMap, numbers } from "../utils/piece";

interface Iimage {
    id: string;
    image_url: string;
    created_at: string;
    updated_at: string;
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
        const imageList = images.map((v: Iimage, i: number) => {
            const format: string = `${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`;
            return (
                <tr key={v.id}>
                  <td>
                    <Link to={`/image/${v.id}`}>
                      <img src={v.image_url} className="img-thumbnail" />
                    </Link>
                  </td>
                  <td className="align-middle">{moment(v.created_at).format(format)}</td>
                  <td className="align-middle">{moment(v.updated_at).format(format)}</td>
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
}
export default withRouter(Label);
