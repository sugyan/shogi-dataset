import moment from "moment";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

import { labels, labelStringMap } from "../utils/piece";

type ImageProps = RouteComponentProps<{ id: string }>;

interface Iimage {
    image_url: string;
    label: string;
    created_at: string;
    updated_at: string;
}

type ImageState = Iimage;

class Image extends React.Component<ImageProps, ImageState> {
    public constructor(props: ImageProps) {
        super(props);
        this.state = {
            created_at: "",
            image_url: "",
            label: "",
            updated_at: "",
        };
    }
    public componentDidMount() {
        const { match } = this.props;
        fetch(
            `/api/image/${match.params.id}`,
        ).then((res: Response) => {
            return res.json();
        }).then((result: Iimage) => {
            this.setState({ ...result });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { image_url, label, created_at, updated_at } = this.state;
        const createdAt: moment.Moment = moment(created_at);
        const updatedAt: moment.Moment = moment(updated_at);
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
                <dt>Updated at</dt>
                <dd>{updatedAt.format(`${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`)}</dd>
              </dl>
              <hr />
              <button className="btn btn-danger" onClick={this.onClickDeleteButton.bind(this)}>
                Delete
              </button>
            </div>
        );
    }
    private onClickDeleteButton() {
        const { match, history } = this.props;
        fetch(
            `/api/image/${match.params.id}`, {
                method: "DELETE",
            },
        ).then((res: Response) => {
            if (res.ok) {
                history.push("/");
            }
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
}
export default withRouter(Image);
