import moment from "moment";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";

import { labels, labelStringMap, numbers } from "../utils/piece";

interface Iimage {
    id: string;
    image_url: string;
    created_at: string;
    updated_at: string;
}

interface IlabelState {
    images: Iimage[];
    total?: number;
}

type IlabelProps = RouteComponentProps<{ label: string }>;

class Label extends React.Component<IlabelProps, IlabelState> {
    public constructor(props: IlabelProps) {
        super(props);
        this.state = {
            images: [],
        };
    }
    public componentDidMount() {
        const { match } = this.props;
        fetch(
            `/api/images?label=${encodeURIComponent(match.params.label)}`,
        ).then((res: Response) => {
            return res.json();
        }).then((results: Iimage[]) => {
            this.setState({ images: results });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
        fetch(
            "/api/index",
        ).then((res: Response) => {
            return res.json();
        }).then((total: numbers) => {
            this.setState({ total: total[match.params.label as labels] });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { match } = this.props;
        const { images, total } = this.state;
        let totalLabel: React.ReactNode;
        if (total !== undefined) {
            totalLabel = (
                <label>全 {total} 件</label>
            );
        }
        const labelName: string = labelStringMap[match.params.label as labels];
        const imageList = images.map((v: Iimage, i: number) => {
            const format: string = `${moment.HTML5_FMT.DATE} ${moment.HTML5_FMT.TIME_SECONDS}`;
            return (
                <tr key={i}>
                  <td>
                    <img src={v.image_url} className="img-thumbnail mx-auto d-block" />
                  </td>
                  <td className="align-middle">{moment(v.created_at).format(format)}</td>
                  <td className="align-middle">{moment(v.updated_at).format(format)}</td>
                </tr>
            );
        });
        return (
            <React.Fragment>
              <h2>{labelName}</h2>
              {totalLabel}
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th></th>
                    <th>Created</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>{imageList}</tbody>
              </table>
            </React.Fragment>
        );
    }
}
export default withRouter(Label);
