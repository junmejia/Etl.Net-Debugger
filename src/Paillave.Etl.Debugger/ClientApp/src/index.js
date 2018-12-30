// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap/dist/css/bootstrap-theme.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import configureStore from './store/configureStore';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { loadState, saveState } from './tools/localStorage';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

// Create browser history to use in the Redux store
const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const history = createBrowserHistory({ basename: baseUrl });

// Get the application-wide store instance, prepopulating with state from the server where available.
const initialState = loadState();//window.initialReduxState;

const store = configureStore(history, initialState);

const storeChange$ = new Subject();
store.subscribe(() => {
  storeChange$.next();
});

storeChange$.pipe(debounceTime(1000)).subscribe(() => saveState(store.getState()));

const rootElement = document.getElementById('root');

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  rootElement);

registerServiceWorker();
