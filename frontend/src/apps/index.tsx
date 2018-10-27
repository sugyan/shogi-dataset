import * as React from "react";
import { Link } from "react-router-dom";

import { labels, labelStringMap } from "../utils/piece";

interface Iimage {
    id: number;
    image_url: string;
    label: string;
    created_at: string;
}

interface IindexResults {
    recent: Iimage[];
    total?: { [label in labels]: number };
}

type IindexState = IindexResults;

export default class Index extends React.Component<any, IindexState> {
    public constructor(props: any) {
        super(props);
        this.state = {
            recent: [],
        };
    }
    public componentDidMount() {
        fetch(
            "/api/index",
        ).then((res) => res.json()).then((results: IindexResults) => {
            this.setState({ ...results });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { recent, total } = this.state;
        let totalTable: React.ReactNode;
        if (total) {
            const rows = Object.values(labels).map((e: labels, i: number) => {
                return (
                  <tr key={i}>
                    <td>{labelStringMap[e]}</td>
                    <td>{total[e]}</td>
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
                {totalTable}
              </div>
              <div className="col-sm">
                {images}
              </div>
            </div>
        );
    }
}
