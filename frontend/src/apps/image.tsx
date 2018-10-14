import moment from "moment";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

import { labels, labelStringMap } from "../utils/piece";

type ImageProps = RouteComponentProps<{ id: string }>;

interface Iimage {
    image_url: string;
    label: string;
    created_at: string;
}

type ImageState = Iimage;

class Image extends React.Component<ImageProps, ImageState> {
    public constructor(props: ImageProps) {
        super(props);
        this.state = {
            created_at: "",
            image_url: "",
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
        const { image_url, label, created_at } = this.state;
        const createdAt: moment.Moment = moment(created_at);
        if (!image_url) {
            return null;
        }
        return (
            <div>
              <img src={image_url} />
              <hr />
              <dl>
                <dt>Image URL</dt>
                <dd><a href={image_url} target="_blank">{image_url}</a></dd>
                <dt>Label</dt>
                <dd>{labelStringMap[label as labels]} (<pre style={{ display: "inline" }}>{label}</pre>)</dd>
                <dt>Created at</dt>
                <dd>{createdAt.format(`${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`)}</dd>
              </dl>
            </div>
        );
    }
}
export default withRouter(Image);
