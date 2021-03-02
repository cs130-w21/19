import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import { formatCommas } from '../utils';
import * as timeago from 'timeago.js';

class Watchlist extends Component {
    formatQuantity(qty, symbol) {
      if (symbol === 'USD') {
        return formatCommas(qty);
      } else {
        return formatCommas(Number(qty).toFixed(0));
      }
    }
  
    render(){
      const { watchlistItems, onSelectStock, isLoggedIn } = this.props;
      return (
        <div className="col">
          <p> Click on an item to view its chart above </p>
        { isLoggedIn ? (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th> Stock Symbol </th>
                <th> Name </th>
                <th> Last Price </th>
                <th> Added </th>
              </tr>
            </thead>
            <tbody>
              {(watchlistItems || []).map((it, i) => (
                <tr key={i} onClick={() => onSelectStock({ ticker: it.ticker, companyName: it.company_name })} style={{ cursor: 'pointer' }}>
                  <td> {it.ticker} </td>
                  <td> {it.company_name} </td>
                  <td> ${this.formatQuantity(it.last_price, 'USD')}</td>
                  <td> {timeago.format(it.date_added)} </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ): (
          <p> Please log in to create some watchlists </p>
        )}


        </div>
      );
    }
    
  }
  
  export default Watchlist;
