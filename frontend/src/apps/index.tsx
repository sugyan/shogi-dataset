import * as React from "react";
import { Link } from "react-router-dom";

interface Iimage {
    id: number;
    imageUrl: string;
    label: string;
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
                    <img src={image.imageUrl} className="card-img-top" />
                  </Link>
                  <div className="card-body">
                    {image.label}
                  </div>
                </div>
            );
        });
        return (
            <div>{images}</div>
        );
    }
}
