import React, { Component } from 'react';
import Joi from 'joi-browser';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Popover from 'react-bootstrap/Popover';
import Card from 'react-bootstrap/Card';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import '../styles/buySellWidget.css';
import { buy, sell } from '../services/tradingService';
import { checkMarketOpen, formatCommas } from '../utils';
import { AlertList } from 'react-bs-notifier';

// PROPS:
/* 
 * mostRecentPrice: most recent price of selected ticker 
 * ticker: ticker of stock selected in CAPITAL LETTERS.
 * user: user information (used to detect if logged in or not
 * onTransactionSuccess: called if transaction is successful.
*/


class BuySellWidget extends Component {
  defaultState = {
    isBuying: true, // true if in buy mode, false if in sell mode.
    isMarketOpen: checkMarketOpen(),
    quantity: '',
    errorMessage: undefined,
    isTransactionPending: false,
    isTransactionComplete: false,
    alert: undefined,
  }

  resetState = () => {
    this.setState(this.defaultState);
  }

  constructor(props) {
    super(props);
    this.state = this.defaultState;
    this.qtyValidator = Joi.object({
      quantity: Joi.number().integer().greater(0)
    });
  }

  componentDidMount() {
    this.marketOpenChecker = setInterval(() => {
      const isMarketOpen = checkMarketOpen();
      if (this.state.isMarketOpen !== isMarketOpen) {
        this.setState({ isMarketOpen });
      }
    }, 1000);
  }

  onQuantityChange = (evt) => {
    const newQty = { quantity: evt.target.value };
    const { error } = this.qtyValidator.validate(newQty);
    let errorMessage = undefined;
    if(error) {
      errorMessage = error.details[0].message;
    }
    this.setState({
      errorMessage,
      quantity: newQty.quantity,
    });
  }

  onModeChange = (eventKey) => {
    const { isTransactionPending, isTransactionComplete } = this.state;
    if (isTransactionComplete || isTransactionPending) {
      return;
    }
    const isBuying = eventKey === 'buySelect';
    this.setState({ 
    isBuying,
    isConfirmationOpen: false,
    });
  }

  onSubmitTrade = async () => {
    this.setState({
      isTransactionPending: true,
      isConfirmationOpen: false,
    })

    try {
      let res;
      if (this.state.isBuying) {
        res = await buy(this.props.ticker, this.state.quantity);
      } else {
        res = await sell(this.props.ticker, this.state.quantity);
      }

      const { executedPrice } = res.data;

      // so we can get the animation running for a bit.
      setTimeout(() => {
        this.setState({
          isTransactionPending: false,
          isTransactionComplete: true,
          alert: {
            id: '1',
            type: 'success',
            message: `Order filled and executed at $${executedPrice}`,
          }
        })
        this.props.onTransactionSuccess();
      }, 500);
    } catch(e) {
      const { errorMessage } = e.response.data;
      this.setState({
        isTransactionPending: false,
        isTransactionComplete: false,
        alert: {
          id: '1',
          type: 'danger',
          message: errorMessage
        }
      });
    }
  }
  onDismissAlert = () => {
    this.setState ({
      alert: undefined,
    });
  }


  render() {
    const { ticker, mostRecentPrice, isLoggedIn } = this.props;
    const {
      quantity,
      isBuying,
      isMarketOpen,
      isTransactionPending,
      isTransactionComplete,
      isConfirmationOpen,
      errorMessage,
      alert,
    } = this.state;
    const isChangeDisabled = isTransactionPending || isTransactionComplete || !isLoggedIn;
    const confirmPopover = (
    <Popover show={ isConfirmationOpen } >
      <Popover.Title as="h3"> Confirm transaction </Popover.Title>
      <Popover.Content>

        <p>Are you sure you'd like to {isBuying? "buy": "sell"} {!errorMessage? formatCommas(quantity): ''} shares{quantity > 1 ? 's': ''} of {ticker} at USD {mostRecentPrice.toFixed(2)} per share?</p>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button 
            onClick={() => this.setState({ isConfirmationOpen: false})}
            variant="secondary"
            >
              Cancel
          </Button>
          <Button 
            onClick={this.onSubmitTrade}
            variant={isBuying? "primary": "danger"}
            >
              Execute {isBuying ? 'purchase' : 'sale'}
          </Button>
        </div>
      </Popover.Content>
    </Popover>

    )
    return (
      <Card
        style={{ paddingLeft: '0.2em', paddingRight: '0.2em' }}
      >
      <AlertList alerts={alert ? [alert]: []} timeout={4500} onDismiss={this.onDismissAlert}/>
      <Card.Title
        style={{ marginTop: '0.2em', marginLeft: '0.2em' }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
          <div>
            {ticker}
          <OverlayTrigger
            trigger={["hover", "focus"]}
            overlay={
              <Popover>The market opens for trading on monday to friday 9:30am - 4pm ET.</Popover>
            }
          >
            <Badge
              variant={isMarketOpen? 'success': 'warning'}
              pill
              style={{ marginLeft: '0.6em' }}
            >
              {isMarketOpen? "market is open": "market closed" }
            </Badge>
          </OverlayTrigger>
          </div>
          { isTransactionComplete ? (
          <Button onClick={this.resetState} variant="info">
            reset
          </Button>
          ) : (<div> </div>)}
        </div>
      </Card.Title>
        <ListGroup
          horizontal
          activeKey={isBuying? "buySelect" : 'sellSelect'}
          onSelect={this.onModeChange}
        >
        <ListGroup.Item className={!isBuying? 'btn-inactive': ''} disabled={isChangeDisabled} action variant="primary" eventKey="buySelect"> Buy </ListGroup.Item>
          <ListGroup.Item className={isBuying? 'btn-inactive': ''} disabled={isChangeDisabled} action variant="danger" eventKey="sellSelect"> Sell</ListGroup.Item>
        </ListGroup>
        <p style={{ marginTop: '0.5em' }}> 
          { isLoggedIn ?
            `Enter a quantity to purchase or sell ${ticker}.`:"Please login/register to trade!"
          }
        </p>

        <h1 className="text-center"> USD {mostRecentPrice.toFixed(2)} </h1>

        <Table size="sm" striped bordered variant="light" style={{ marginTop: '1em' }}>
          <tbody>
            <tr>
              <td> Amount to {isBuying? "buy": "sell"}</td>
              <td>
                <InputGroup size="sm" style={{ marginTop: '0.5em' }}>
                  <FormControl
                    placeholder="enter amount"
                    onChange={this.onQuantityChange}
                    isInvalid={!!this.state.errorMessage}
                    disabled={isChangeDisabled}
                    value={quantity}
                  />
                  <FormControl.Feedback
                    tooltip 
                    type={!errorMessage? "valid": "invalid"}
                  >
                    { errorMessage ? errorMessage: "Looks good!"}
                  </FormControl.Feedback>
                  <InputGroup.Append>
                    <InputGroup.Text id="inputGroup-sizing-sm">Shares</InputGroup.Text>
                  </InputGroup.Append>
                </InputGroup>
              </td>
            </tr>
            <tr>
              <td> Market Value</td>
              <td> <strong> USD { errorMessage? '-' : formatCommas((quantity * mostRecentPrice).toFixed(2))} </strong> </td>
            </tr>
          </tbody>
        </Table>
          <OverlayTrigger
            overlay={confirmPopover}
            placement="bottom"
            trigger="click"
            onToggle={(isOpen)=> this.setState({ isConfirmationOpen: isOpen })}
            onHide={()=> this.setState({ isConfirmationOpen: false })}
            rootClose
            show={isConfirmationOpen}
          >
            <Button
              variant={isTransactionComplete ? "success": (isBuying? "primary": "danger")}
              disabled={!quantity || errorMessage || !isMarketOpen || isChangeDisabled}
            >
            { isTransactionPending ? (
            <>
              <Spinner animation="grow" size="sm" variant="light" style={{ marginLeft: '0.5em'}}/>
              <Spinner animation="grow" size="sm" variant="light" style={{ marginLeft: '0.5em'}}/>
              <Spinner animation="grow" size="sm" variant="light" style={{ marginLeft: '0.5em'}}/>
            </>
            ) : (
            <>
            {isTransactionComplete ? (isBuying? "bought": "sold") : (isBuying? "buy": "sell")} {!errorMessage? formatCommas(quantity): '-'} unit{quantity > 1 ? 's': ''} {ticker} at USD {mostRecentPrice.toFixed(2)} {isTransactionComplete? '✅': ''}
            </>
            )}
            </Button>
          </OverlayTrigger>
      </Card>
    );
  }

}

export default BuySellWidget;
