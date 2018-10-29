import * as React from "react";
import { Link } from "react-router-dom";

import { labels, labelStringMap, numbers } from "../utils/piece";

interface Iimage {
    id: string;
    image_url: string;
    label: string;
    created_at: string;
}

interface IimagesResult {
    images: Iimage[];
    cursor: string;
}

interface IindexState {
    recent: Iimage[];
    total?: numbers;
}

export default class Index extends React.Component<{}, IindexState> {
    public constructor(props: any) {
        super(props);
        this.state = {
            recent: [],
        };
    }
    public componentDidMount() {
        fetch(
            "/api/index",
        ).then((res: Response) => {
            return res.json();
        }).then((total: numbers) => {
            this.setState({ total });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
        fetch(
            "/api/images",
        ).then((res: Response) => {
            return res.json();
        }).then((results: IimagesResult) => {
            this.setState({ recent: results.images });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { total, recent } = this.state;
        let totalTable: React.ReactNode;
        if (total) {
            const rows = Object.values(labels).map((e: labels, i: number) => {
                return (
                  <tr key={i}>
                    <td>{labelStringMap[e]}</td>
                    <td>
                      <Link to={`/label/${e}`} className="btn btn-sm btn-link">
                        {total[e]}
                      </Link>
                    </td>
                  </tr>
                );
            });
            totalTable = (
                <table className="table table-sm table-hover">
                  <tbody>{rows}</tbody>
                </table>
            );
        }
        const images = recent.map((image: Iimage, i: number) => {
            return (
                <div
                  key={i}
                  className="card"
                  style={{ width: 96 + 2, float: "left", marginRight: 5, marginBottom: 10 }}
                >
                  <Link to={`/image/${image.id}`}>
                    <img src={image.image_url} className="card-img-top" />
                  </Link>
                  <div className="card-body">
                    {labelStringMap[image.label as labels]}
                  </div>
                </div>
            );
        });
        return (
            <div className="row">
              <div className="col-sm">
                <h2>Total</h2>
                {totalTable}
              </div>
              <div className="col-sm">
                <h2>Recently updated</h2>
                {images}
              </div>
            </div>
        );
    }
}
