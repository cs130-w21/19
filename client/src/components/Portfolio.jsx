import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import { formatCommas } from '../utils';
import * as timeago from 'timeago.js';
import Alert from 'react-bootstrap/Alert'

class Portfolio extends Component {

    formatQuantity(qty, symbol) {
      if (symbol === 'USD') {
        return formatCommas(qty);
      } else {
        return formatCommas(Number(qty).toFixed(0));
      }
    }

    getStockValueNumber(quantity, pricePerShare) {
      return formatCommas((Number(quantity) * Number(pricePerShare)).toFixed(2));
    }

  

    onSelectPortfolioItem = ({ ticker, companyName }) => {
      if(!this.props.enableClick){
        return false;
      }
      if (ticker !== 'USD') {
        this.props.onSelectStock({ticker, companyName });
      }
    }
  
    render(){
      const {items = [], titleLess, light, isLoggedIn } = this.props;
      //const user = Store.get('user');
      
      

      

      return (
        <div>
        {isLoggedIn &&  (<React.Fragment>
        <div className="col">
          { ! titleLess && (
            <h1>My Portfolio</h1>
          )}
          <Table striped bordered hover variant={light? 'light': 'dark'}>
            <thead>
              <tr>
                <th> Symbol </th>
                <th> Shares Owned </th>
                <th> Current Price </th>
                <th> Value </th>
                <th> Date changed </th>
              </tr>
            </thead>
            
              <tbody>
              {items.map((it, i) => (
                <tr key={i} onClick={() => this.onSelectPortfolioItem({ ticker: it.symbol, companyName: it.company_name })} style={{ cursor: 'pointer' }}>
                  <td> {it.symbol} </td>
                  <td>
                    {it.symbol === 'USD' ? '-' : this.formatQuantity(it.quantity, it.symbol)}
                  </td>
                  <td> {it.symbol === "USD" ? "-": `$${this.formatQuantity(it.price_per_share, 'USD')}`} </td>
                  <td> ${it.symbol === "USD" ? this.formatQuantity(it.quantity, 'USD') : this.getStockValueNumber(it.quantity, it.price_per_share)}</td>
                  <td> {timeago.format(it.date_changed)} </td>
                </tr>
              ))}
            </tbody>

          </Table>
          
        </div>

      
        </React.Fragment>)}

        { !isLoggedIn && (<React.Fragment>
          <Alert key={'alertForProfolio'} variant={'info'} style={{marginTop:'10px'}}>
                Please log in to view your portfolio!
          </Alert>

        </React.Fragment>)

        }

        </div>
      );
    }
    
  }
  
  export default Portfolio;
