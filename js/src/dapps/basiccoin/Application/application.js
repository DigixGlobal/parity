// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component, PropTypes } from 'react';

import { api } from '../parity';
import { attachInstances } from '../services';

import Header from './Header';
import Loading from './Loading';

import styles from './application.css';

export default class Application extends Component {
  static childContextTypes = {
    accounts: PropTypes.object,
    managerInstance: PropTypes.object,
    registryInstance: PropTypes.object,
    tokenregInstance: PropTypes.object
  }

  static propTypes = {
    children: PropTypes.node.isRequired
  }

  state = {
    accounts: null,
    loading: true,
    managerInstance: null,
    registryInstance: null,
    tokenregInstance: null
  }

  componentDidMount () {
    this.attachInstance();
  }

  render () {
    const { children } = this.props;
    const { loading } = this.state;

    if (loading) {
      return (
        <Loading />
      );
    }

    return (
      <div className={ styles.container }>
        <Header />
        <div className={ styles.body }>
          { children }
        </div>
      </div>
    );
  }

  getChildContext () {
    const { accounts, managerInstance, registryInstance, tokenregInstance } = this.state;

    return {
      accounts,
      managerInstance,
      registryInstance,
      tokenregInstance
    };
  }

  attachInstance () {
    Promise
      .all([
        attachInstances(),
        api.personal.accountsInfo()
      ])
      .then(([{ managerInstance, registryInstance, tokenregInstance }, accountsInfo]) => {
        this.setState({
          loading: false,
          managerInstance,
          registryInstance,
          tokenregInstance,
          accounts: Object
            .keys(accountsInfo)
            .filter((address) => !accountsInfo[address].meta.deleted)
            .sort((a, b) => {
              return (accountsInfo[b].uuid || '').localeCompare(accountsInfo[a].uuid || '');
            })
            .reduce((accounts, address) => {
              accounts[address] = Object.assign(accountsInfo[address], { address });
              return accounts;
            }, {})
        });
      });
  }
}
