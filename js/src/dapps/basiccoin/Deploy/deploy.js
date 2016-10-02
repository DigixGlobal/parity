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

import Container from '../Container';
import styles from './deploy.css';
import layout from '../style.css';

const ERRORS = {
  name: 'specify a valid name >2 & <32 characters',
  tla: 'specify a valid TLA, 3 characters in length'
};

export default class Deploy extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired,
    managerInstance: PropTypes.object.isRequired,
    registryInstance: PropTypes.object.isRequired,
    tokenregInstance: PropTypes.object.isRequired
  }

  state = {
    base: null,
    deployBusy: false,
    deployDone: false,
    deployError: null,
    deployState: null,
    globalReg: false,
    globalFee: 0,
    globalFeeText: '1.000',
    fromAddress: '0x63Cf90D3f0410092FC0fca41846f596223979195',
    name: '',
    nameError: ERRORS.name,
    tla: '',
    tlaError: ERRORS.tla,
    totalSupply: '5000000',
    totalSupplyError: null,
    signerRequestId: null,
    txHash: null
  }

  componentDidMount () {
    const { managerInstance, tokenregInstance } = this.context;

    Promise
      .all([
        managerInstance.base.call(),
        tokenregInstance.fee.call()
      ])
      .then(([base, globalFee]) => {
        this.setState({
          base,
          baseText: base.toFormat(0),
          globalFee,
          globalFeeText: api.util.fromWei(globalFee).toFormat(3)
        });
      });
  }

  render () {
    const { deployBusy } = this.state;

    return deployBusy
      ? this.renderDeploying()
      : this.renderForm();
  }

  renderDeploying () {
    const { deployDone, deployError, deployState } = this.state;

    if (deployDone) {
      return (
        <Container center>
          <div className={ styles.statusHeader }>
            Your token has been deployed
          </div>
          <div className={ styles.statusInfo }>
            Start <a href='#/send' className={ styles.link }>sending tokens</a> or <a href='#/overview' className={ styles.link }>view information</a> relating to this and any of your other tokens.
          </div>
          <div className={ styles.statusState }>
            { deployState }
          </div>
        </Container>
      );
    }

    let error = null;
    if (deployError) {
      error = (
        <div className={ styles.statusError }>
          { deployError }
        </div>
      );
    }

    return (
      <Container center>
        <div className={ styles.statusHeader }>
          Your token is currently being deployed to the network
        </div>
        <div className={ styles.statusState }>
          { deployState }
        </div>
        { error }
      </Container>
    );
  }

  renderForm () {
    const { baseText, globalFeeText, name, nameError, tla, tlaError, totalSupply, totalSupplyError } = this.state;
    const hasError = !!(nameError || tlaError || totalSupplyError);
    const error = `${layout.input} ${layout.error}`;

    return (
      <Container>
        <div className={ layout.form }>
          <div className={ nameError ? error : layout.input }>
            <label>token name</label>
            <input
              value={ name }
              name='name'
              onChange={ this.onChangeName } />
            <div className={ layout.hint }>
              { nameError || 'an identifying name for the token' }
            </div>
          </div>
          <div className={ tlaError ? error : layout.input }>
            <label>token TLA</label>
            <input
              className={ layout.small }
              name='tla'
              value={ tla }
              onChange={ this.onChangeTla } />
            <div className={ layout.hint }>
              { tlaError || 'unique network acronym for this token' }
            </div>
          </div>
          <div className={ totalSupplyError ? error : layout.input }>
            <label>total number of tokens</label>
            <input
              type='number'
              min='1000'
              max='999999999'
              name='totalSupply'
              value={ totalSupply }
              onChange={ this.onChangeSupply } />
            <div className={ layout.hint }>
              { totalSupplyError || `number of tokens in circulation (base: ${baseText})` }
            </div>
          </div>
          <div className={ layout.input }>
            <label>global registration</label>
            <select onChange={ this.onChangeRegistrar }>
              <option value='no'>No, only for me</option>
              <option value='yes'>Yes, for everybody</option>
            </select>
            <div className={ layout.hint }>
              register as a network token (fee: { globalFeeText }<small>ETH</small>)
            </div>
          </div>
        </div>
        <div className={ styles.buttonRow }>
          <div
            className={ styles.button }
            disabled={ hasError }
            onClick={ this.onDeploy }>
            Deploy Token
          </div>
        </div>
      </Container>
    );
  }

  onChangeName = (event) => {
    const name = event.target.value;
    const nameError = name && (name.length > 2) && (name.length < 32)
      ? null
      : ERRORS.name;

    this.setState({ name, nameError });
  }

  onChangeRegistrar = (event) => {
    this.setState({ globalReg: event.target.value === 'yes' });
  }

  onChangeSupply = (event) => {
    const totalSupply = event.target.value;

    this.setState({ totalSupply });
  }

  onChangeTla = (event) => {
    const _tla = event.target.value;
    const tla = _tla && (_tla.length > 3)
      ? _tla.substr(0, 3)
      : _tla;
    const tlaError = tla && (tla.length === 3)
      ? null
      : ERRORS.tla;

    this.setState({ tla, tlaError });
  }

  onDeploy = () => {
    const { managerInstance, registryInstance, tokenregInstance } = this.context;
    const { base, deployBusy, fromAddress, globalReg, globalFee, name, nameError, tla, tlaError, totalSupply, totalSupplyError } = this.state;
    const hasError = !!(nameError || tlaError || totalSupplyError);

    if (hasError || deployBusy) {
      return;
    }

    const tokenreg = (globalReg ? tokenregInstance : registryInstance).address;
    const values = [base.mul(totalSupply), tla, name, tokenreg];
    let gasPassed = 0;
    const options = {
      from: fromAddress,
      value: globalReg ? globalFee : 0
    };

    this.setState({ deployBusy: true, deployState: 'Estimating gas for the transaction' });

    managerInstance
      .deploy.estimateGas(options, values)
      .then((gas) => {
        this.setState({ deployState: 'Gas estimated, Posting transaction to the network' });

        gasPassed = gas.mul(1.2);
        options.gas = gasPassed.toFixed(0);
        console.log(`gas estimated at ${gas.toFormat(0)}, passing ${gasPassed.toFormat(0)}`);

        return managerInstance.deploy.postTransaction(options, values);
      })
      .then((signerRequestId) => {
        this.setState({ signerRequestId, deployState: 'Transaction posted, Waiting for transaction authorization' });

        return api.pollMethod('eth_checkRequest', signerRequestId);
      })
      .then((txHash) => {
        this.setState({ txHash, deployState: 'Transaction authorized, Waiting for network confirmations' });

        return api.pollMethod('eth_getTransactionReceipt', txHash, (receipt) => {
          if (!receipt || !receipt.blockNumber || receipt.blockNumber.eq(0)) {
            return false;
          }

          return true;
        });
      })
      .then((txReceipt) => {
        this.setState({ txReceipt, deployDone: true, deployState: 'Network confirmed, Received transaction receipt' });
      })
      .catch((error) => {
        console.error('onDeploy', error);
        this.setState({ deployError: error.message });
      });
  }
}
