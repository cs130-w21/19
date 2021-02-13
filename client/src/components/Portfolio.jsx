import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import { formatCommas } from '../utils';

class Portfolio extends Component{
    formatQuantity(qty, symbol) {
      if (symbol === 'USD') {
        return formatCommas(qty);
      } else {
        return formatCommas(Number(qty).toFixed(0));
      }
    }
  
    render(){
      const {items} = this.props;
      return (
        <div className="col">
          <h1>My Portfolio</h1>
          <Table striped bordered hover variant='dark'>
            <thead>
              <tr>
                <th> Symbol </th>
                <th> Amount </th>
                <th> Date changed </th>
              </tr>
            </thead>
            <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td> {it.symbol} </td>
                <td> <strong> {it.symbol === "USD" ? "$": ''} {this.formatQuantity(it.quantity, it.symbol)} {it.symbol !== "USD" ? "Shares": ''} </strong> </td>
                <td> {it.date_changed} </td>
              </tr>
            ))}
            </tbody>
          </Table>
        </div>
      );
    }
    
  }
  
  export default Portfolio;