import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

import { ImageResponse } from "../../utils/api";
import { labels, labelStringMap } from "../../utils/piece";

interface Label {
    label: string;
    value: string;
}

type Props = RouteComponentProps<{ id: string }>;

interface State {
    image?: ImageResponse;
    label: string;
}

class ImageEdit extends React.Component<Props, State> {
    private options = Object.values(labels).map((e: labels): Label => {
        return {
            label: labelStringMap[e],
            value: e,
        };
    });

    public constructor(props: Props) {
        super(props);
        this.state = {
            label: "",
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
            this.setState({
                image,
                label: image.label,
            });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
    public render(): JSX.Element {
        const { image, label } = this.state;
        const selectInput = "selectLabel";
        const options = this.options.map((option: Label, i: number): JSX.Element => {
            return <option key={i} value={option.value}>{option.label}</option>;
        });
        return (
          <div>
            <img src={image && image.image_url} alt="piece" className="img-thumbnail" />
            <hr />
            <form onSubmit={this.onSubmit.bind(this)}>
              <div className="form-group">
                <label htmlFor={selectInput}>label</label>
                <select
                    id={selectInput}
                    className="form-control"
                    onChange={this.onChangeSelect.bind(this)}
                    value={label}>
                  {options}
                </select>
              </div>
              <hr />
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </form>
          </div>
        );
    }
    private onChangeSelect(ev: React.ChangeEvent): void {
        const select: HTMLSelectElement = ev.target as HTMLSelectElement;
        this.setState({
            label: select.value,
        });
    }
    private onSubmit(ev: React.FormEvent): void {
        ev.preventDefault();

        const { match, history } = this.props;
        const { label } = this.state;
        fetch(
            `/api/image/${match.params.id}`, {
                body: new URLSearchParams({ label }),
                method: "PUT",
            },
        ).then((res: Response): void => {
            if (res.ok) {
                history.push(`/image/${match.params.id}`);
            } else {
                throw new Error(res.statusText);
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
}
export default withRouter(ImageEdit);
