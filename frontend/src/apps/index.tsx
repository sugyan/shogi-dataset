import * as React from "react";

interface Iimage {
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
    public componentDidMount() {
        fetch(
            "/api/index",
        ).then((res) => res.json()).then((results: Iimage[]) => {
            this.setState({ recentImages: results });
        }).catch((err) => {
            window.console.error(err);
        });
    }
    public render() {
        const { recentImages } = this.state;
        const images = recentImages.map((image: Iimage, i: number) => {
            return (
                <div key={i} className="card" style={{ width: 96 + 2, float: "left", marginRight: 5 }}>
                  <img src={image.imageUrl} className="card-img-top" />
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
