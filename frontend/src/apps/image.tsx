import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Route } from "react-router-dom";

import ImageEdit from "./image/edit";
import ImageIndex from "./image/index";

type Props = RouteComponentProps<{}>;

class Image extends React.Component<Props> {
    public render() {
        const { match } = this.props;
        return (
            <React.Fragment>
              <Route exact path={`${match.url}/:id`} component={ImageIndex} />
              <Route exact path={`${match.url}/:id/edit`} component={ImageEdit} />
            </React.Fragment>
        );
    }
}
export default withRouter(Image);
