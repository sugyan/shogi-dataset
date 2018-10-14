import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

type ImageProps = RouteComponentProps<{ id: string }>;

interface Iimage {
    imageUrl: string;
    label: string;
    createdAt: string;
}

type ImageState = Iimage;

class Image extends React.Component<ImageProps, ImageState> {
    public constructor(props: ImageProps) {
        super(props);
        this.state = {
            createdAt: "",
            imageUrl: "",
            label: "",
        };
    }
    public componentDidMount() {
        const { match } = this.props;
        const params: URLSearchParams = new URLSearchParams({ id: match.params.id });
        fetch(
            `/api/image?${params.toString()}`,
        ).then((res: Response) => {
            return res.json();
        }).then((result: Iimage) => {
            this.setState({ ...result });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { imageUrl, label } = this.state;
        return (
            <div>
              <img src={imageUrl} />
              <label>{label}</label>
            </div>
        );
    }
}
export default withRouter(Image);
