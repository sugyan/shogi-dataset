import * as React from "react";
import { Link } from "react-router-dom";

import { labels, labelStringMap } from "../utils/piece";

interface Iimage {
    id: number;
    image_url: string;
    label: string;
    created_at: string;
}

interface IindexState {
    recentImages: Iimage[];
}

export default class Index extends React.Component<any, IindexState> {
    public constructor(props: any) {
        super(props);
        this.state = {
            recentImages: [],
        };
    }
    public componentWillMount() {
        fetch(
            "/api/index",
        ).then((res) => res.json()).then((results: Iimage[]) => {
            this.setState({ recentImages: results });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { recentImages } = this.state;
        const images = recentImages.map((image: Iimage, i: number) => {
            return (
                <div
                  key={i}
                  className="card"
                  style={{ width: 96 + 2, float: "left", marginRight: 5 }}
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
            <div>{images}</div>
        );
    }
}
