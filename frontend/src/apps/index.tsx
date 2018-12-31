import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { Istate } from "../redux/reducer";
import { Iuser, userRole } from "../redux/reducers/common";
import { labels, labelStringMap, numbers } from "../utils/piece";

interface Iimage {
    id: string;
    image_url: string;
    label: string;
    created_at: string;
}

interface IimagesResult {
    images: Iimage[];
    cursor: string;
}

interface IstateProps {
    user?: Iuser;
}

type Props = IstateProps;

interface IindexState {
    recent: Iimage[];
    total?: numbers;
}

class Index extends React.Component<Props, IindexState> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            recent: [],
        };
    }
    public componentDidMount() {
        fetch(
            "/api/index",
        ).then((res: Response) => {
            return res.json();
        }).then((total: numbers) => {
            this.setState({ total });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
        fetch(
            "/api/images",
        ).then((res: Response) => {
            return res.json();
        }).then((results: IimagesResult) => {
            this.setState({ recent: results.images });
        }).catch((err: Error) => {
            window.console.error(err.message);
        });
    }
    public render() {
        const { user } = this.props;
        const { total, recent } = this.state;
        let loginAlert: React.ReactNode;
        if (user && user.role === userRole.anonymous) {
            loginAlert = (
              <div className="row">
                <div className="col-12">
                  <div className="alert alert-info">
                    To see all the data, please <Link to="/login">login</Link>.
                  </div>
                </div>
              </div>
            );
        }
        const totalTableRows = Object.values(labels).map((e: labels, i: number) => {
            const value: number = total ? total[e] : 0;
            const totalValue = (user && user.role !== userRole.anonymous)
            ? (
                <Link to={`/label/${e}`} className="btn btn-sm btn-link">{value}</Link>
            ) : (
                <button className="btn btn-sm" disabled={true}>{value}</button>
            );
            return (
                <tr key={i}>
                  <td className="align-middle">{labelStringMap[e]}</td>
                  <td>{totalValue}</td>
                </tr>
            );
        });
        const totalTable = (
            <table className="table table-sm table-hover">
              <tbody>{totalTableRows}</tbody>
            </table>
        );
        const images = recent.map((image: Iimage, i: number) => {
            return (
                <div
                  key={i}
                  className="card"
                  style={{ width: 96 + 2, float: "left", marginRight: 5, marginBottom: 10 }}
                >
                  <Link to={`/image/${image.id}`}>
                    <img src={image.image_url} className="card-img-top" />
                  </Link>
                  <div className="card-body">
                    {labelStringMap[image.label as labels]}
                  </div>
                </div>
            );
        });
        return (
            <div>
              {loginAlert}
              <div className="row">
                <div className="col-sm">
                  <h2>Total</h2>
                  {totalTable}
                </div>
                <div className="col-sm">
                  <h2>Recently updated</h2>
                  {images}
                </div>
              </div>
            </div>
        );
    }
}

export default connect(
    (state: Istate): IstateProps => {
        return {
            user: state.commonReducer.user,
        };
    },
)(Index);
