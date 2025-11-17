import React from 'react';
import { Switch, Route } from 'react-router-dom';
import pluginId from '../../helpers/pluginId';

import OverviewPage from './OverviewPage';
import DetailPage from './DetailPage';
import WebhookPage from './WebhookPage';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}`} component={OverviewPage} exact />
        <Route path={`/plugins/${pluginId}/new`} component={DetailPage} exact />
        <Route path={`/plugins/${pluginId}/webhook`} component={WebhookPage} exact />
        <Route path={`/plugins/${pluginId}/:id`} component={DetailPage} exact />
      </Switch>
    </div>
  );
};

export default App;