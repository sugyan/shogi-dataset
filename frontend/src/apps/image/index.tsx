import { DateTime } from "luxon";
import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { Istate } from "../../redux/reducer";
import { Iuser, userRole } from "../../redux/reducers/common";
import { labels, labelStringMap } from "../../utils/piece";

interface IstateProps {
    user?: Iuser;
}

type Props = IstateProps & RouteComponentProps<{ id: string }>;

interface Iimage {
    image_url: string;
    label: string;
    user?: string;
    created_at: string;
    updated_at: string;
}

interface IimageIndexState {
    image?: Iimage;
}

class ImageIndex extends React.Component<Props, IimageIndexState> {
    public constructor(props: Props) {
        super(props);
        this.state = {
        };
    }
    public componentDidMount() {
        const { match } = this.props;
        fetch(
            `/api/image/${match.params.id}`,
        ).then((res: Response) => {
            return res.json();
        }).then((image: Iimage) => {
            this.setState({ image });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { user } = this.props;
        const { image } = this.state;
        const format: string = "yyyy-LL-dd TT";
        if (!image) {
            return null;
        }
        const editButtons: React.ReactNode = (
            <React.Fragment>
              <button
                className="btn btn-info"
                style={{ marginRight: 10 }}
                onClick={this.onClickEditButton.bind(this)}>
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={this.onClickDeleteButton.bind(this)}>
                Delete
              </button>
            </React.Fragment>
        );
        const label: React.ReactNode = user
            ? <Link to={`/label/${image.label}`}><pre style={{ display: "inline" }}>{image.label}</pre></Link>
            : <pre style={{ display: "inline" }}>{image.label}</pre>;
        return (
            <div>
              <img src={image.image_url} className="img-thumbnail" />
              <hr />
              <dl>
                <dt>Image URL</dt>
                <dd><a href={image.image_url} target="_blank">{image.image_url}</a></dd>
                <dt>Label</dt>
                <dd>
                  {labelStringMap[image.label as labels]} ({label})
                </dd>
                <dt>Uploaded by</dt>
                <dd>{image.user}</dd>
                <dt>Created at</dt>
                <dd>{DateTime.fromISO(image.created_at).toFormat(format)}</dd>
                <dt>Updated at</dt>
                <dd>{DateTime.fromISO(image.updated_at).toFormat(format)}</dd>
              </dl>
              <hr />
              {user && user.role === userRole.editor && editButtons}
            </div>
        );
    }
    private onClickEditButton() {
        const { match, history } = this.props;
        history.push(`/image/${match.params.id}/edit`);
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
export default withRouter(
    connect(
        (state: Istate): IstateProps => {
            return {
                user: state.commonReducer.user,
            };
        },
    )(ImageIndex),
);
