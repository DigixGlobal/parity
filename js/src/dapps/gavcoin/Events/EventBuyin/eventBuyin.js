import React, { Component, PropTypes } from 'react';

import { formatBlockNumber } from '../format';

const { Api } = window.parity;

const DIVISOR = 10 ** 6;

export default class EventBuyin extends Component {
  static propTypes = {
    event: PropTypes.object
  }

  render () {
    const { event } = this.props;
    const { buyer, price, amount } = event.params;
    const blockNumber = formatBlockNumber(event);
    const cls = `event ${event.state}`;

    return (
      <div className={ cls }>
        { blockNumber }: Buyin: { buyer } bought { amount.div(DIVISOR).toFormat(6) } @ { Api.format.fromWei(price).toFormat(3) }
      </div>
    );
  }
}
