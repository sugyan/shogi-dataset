import { DateTime } from "luxon";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { AppState } from "../../redux/store";
import { User, UserRole } from "../../redux/reducers";
import { ImageResponse } from "../../utils/api";
import { labels, labelStringMap } from "../../utils/piece";

interface StateProps {
    user?: User;
}

type Props = StateProps & RouteComponentProps<{ id: string }>;

interface State {
    image?: ImageResponse;
}

class ImageIndex extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = {
        };
    }
    public componentDidMount(): void {
        const { match } = this.props;
        fetch(
            `/api/image/${match.params.id}`,
        ).then((res: Response): Promise<ImageResponse> => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        }).then((image: ImageResponse): void => {
            this.setState({ image });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
    public render(): JSX.Element | null {
        const { user } = this.props;
        const { image } = this.state;
        const format = "yyyy-LL-dd TT";
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
        const label: React.ReactNode = user && user.role !== UserRole.anonymous
            ? <Link to={`/label/${image.label}`}><pre style={{ display: "inline" }}>{image.label}</pre></Link>
            : <pre style={{ display: "inline" }}>{image.label}</pre>;
        return (
          <div>
            <img src={image.image_url} alt="piece" className="img-thumbnail" />
            <hr />
            <dl>
              <dt>Image URL</dt>
              <dd><a href={image.image_url} target="_blank" rel="noopener noreferrer">{image.image_url}</a></dd>
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
            {user && user.role === UserRole.editor && editButtons}
          </div>
        );
    }
    private onClickEditButton(): void {
        const { match, history } = this.props;
        history.push(`/image/${match.params.id}/edit`);
    }
    private onClickDeleteButton(): void {
        const { match, history } = this.props;
        fetch(
            `/api/image/${match.params.id}`, {
                method: "DELETE",
            },
        ).then((res: Response): void => {
            if (res.ok) {
                history.push("/");
            } else {
                throw new Error(res.statusText);
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
}

export default withRouter(
    connect(
        (state: AppState): StateProps => {
            return {
                user: state.userReducer.user,
            };
        },
    )(ImageIndex),
);
