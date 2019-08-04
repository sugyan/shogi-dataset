import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Route } from "react-router-dom";

import ImageEdit from "./image/Edit";
import ImageIndex from "./image/Index";

type Props = RouteComponentProps<{}>;

class Image extends React.Component<Props> {
    public render(): JSX.Element {
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
