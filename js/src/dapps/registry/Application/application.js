import React, { Component, PropTypes } from 'react';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
const muiTheme = getMuiTheme(lightBaseTheme);

import CircularProgress from 'material-ui/CircularProgress';
import styles from './application.css';
import Accounts from '../accounts';
import Lookup from '../Lookup';
import Register from '../register';
import Events from '../events';

export default class Application extends Component {
  static childContextTypes = { muiTheme: PropTypes.object };
  getChildContext () {
    return { muiTheme };
  }

  static propTypes = {
    actions: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    contract: PropTypes.object.isRequired,
    fee: PropTypes.object.isRequired,
    lookup: PropTypes.object.isRequired,
    events: PropTypes.array.isRequired,
    register: PropTypes.object.isRequired
  };

  render () {
    const {
      actions,
      accounts,
      contract, fee,
      lookup,
      events,
      register
    } = this.props;

    return (
      <div>
        <div className={ styles.header }>
          <h1>RΞgistry</h1>
          <Accounts { ...accounts } actions={ actions.accounts } />
        </div>
        { contract && fee ? (
          <div>
            <Lookup { ...lookup } actions={ actions.lookup } />
            <Register { ...register } fee={ fee } actions={ actions.register } />
            <Events { ...events } actions={ actions.events } />
          </div>
        ) : (
          <CircularProgress size={ 1 } />
        ) }
      </div>
    );
  }

}
