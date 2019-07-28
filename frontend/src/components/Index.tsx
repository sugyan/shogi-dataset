import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

// import { Istate } from "../redux/reducer";
// import { Iuser, userRole } from "../redux/reducers/common";
import { User, UserRole } from "../redux/reducers";
import { labels, labelStringMap, numbers } from "../utils/piece";
import { AppState } from "../redux/store";

interface Image {
    id: string;
    image_url: string;
    label: string;
    created_at: string;
}

// interface IimagesResult {
//     images: Iimage[];
//     cursor: string;
// }

interface StateProps {
    user?: User;
}

type Props = StateProps;

interface State {
    recent: Image[];
    total?: numbers;
}

class Index extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            recent: [],
        };
    }
    public componentDidMount(): void {
        fetch(
            "/api/total",
        ).then((res: Response): Promise<numbers> => {
            return res.json();
        }).then((total: numbers): void => {
            this.setState({ total });
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    //     fetch(
    //         "/api/latest",
    //     ).then((res: Response) => {
    //         return res.json();
    //     }).then((results: IimagesResult) => {
    //         this.setState({ recent: results.images });
    //     }).catch((err: Error) => {
    //         window.console.error(err.message);
    //     });
    }
    public render(): JSX.Element {
        const { user } = this.props;
        const { total, recent } = this.state;
        const loginAlert = (user && user.role === UserRole.anonymous) ? (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-info">
                To see all the data, please <Link to="/login">login</Link>.
              </div>
            </div>
          </div>
        ) : null;
        const totalTableRows = Object.values(labels).map((e: labels, i: number): JSX.Element => {
            const value: number = total ? total[e] : 0;
            // const totalValue = (user && user.role !== userRole.anonymous)
            // ? (
            //     <Link to={`/label/${e}`} className="btn btn-sm btn-link">{value}</Link>
            // ) : (
            //     <button className="btn btn-sm" disabled={true}>{value}</button>
            // );
            const totalValue = <Link to={`/label/${e}`} className="btn btn-sm btn-link">{value}</Link>;
            return (
              <tr key={i}>
                <td className="align-middle">{labelStringMap[e]}</td>
                <td>{totalValue}</td>
              </tr>
            );
        });
        // const images = recent.map((image: Iimage, i: number) => {
        //     return (
        //         <div
        //           key={i}
        //           className="card"
        //           style={{ width: 96 + 2, float: "left", marginRight: 5, marginBottom: 10 }}
        //         >
        //           <Link to={`/image/${image.id}`}>
        //             <img src={image.image_url} className="card-img-top" />
        //           </Link>
        //           <div className="card-body">
        //             {labelStringMap[image.label as labels]}
        //           </div>
        //         </div>
        //     );
        // });
        return (
          <div>
            {loginAlert}
            <div className="row">
              <div className="col-sm">
                <h2>Total</h2>
                <table className="table table-sm table-hover">
                  <tbody>{totalTableRows}</tbody>
                </table>
              </div>
              <div className="col-sm">
                <h2>Recently updated</h2>
                {/* {images} */}
              </div>
            </div>
          </div>
        );
    }
}

export default connect(
    (state: AppState): StateProps => {
        return {
            user: state.userReducer.user,
        };
    },
)(Index);
