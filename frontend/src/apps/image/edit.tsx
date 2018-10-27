import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

import { labels, labelStringMap } from "../../utils/piece";

interface Ilabel {
    label?: string;
    value?: string;
}

type ImageEditProps = RouteComponentProps<{ id: string }>;

interface Iimage {
    image_url: string;
    label: string;
}

type ImageEditState = Iimage;

class ImageEdit extends React.Component<ImageEditProps, ImageEditState> {
    private options: Ilabel[];
    public constructor(props: ImageEditProps) {
        super(props);
        this.options = [{}].concat(Object.values(labels).map((e: labels): Ilabel => {
            return {
                label: labelStringMap[e],
                value: e,
            };
        }));
        this.state = {
            image_url: "",
            label: "",
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
        const { image_url, label } = this.state;
        const selectInput: string = "selectLabel";
        const options = this.options.map((option: Ilabel, i: number) => {
            return (
                <option key={i} value={option.value}>{option.label}</option>
            );
        });
        return (
            <div>
              <img src={image_url}/>
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
    private onChangeSelect(ev: Event) {
        const select: HTMLSelectElement = ev.target as HTMLSelectElement;
        this.setState({
            label: select.value,
        });
    }
    private onSubmit(ev: Event) {
        ev.preventDefault();

        const { match, history } = this.props;
        const { label } = this.state;
        fetch(
            `/api/image/${match.params.id}`, {
                body: new URLSearchParams({ label }),
                method: "PUT",
            },
        ).then((res: Response) => {
            if (res.ok) {
                history.push(`/image/${match.params.id}`);
            }
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
}
export default withRouter(ImageEdit);
