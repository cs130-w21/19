import React, { Component } from 'react';
import {Link} from "react-router-dom";
import Tablehis from "../components/common/table";



class HistoryTable extends Component {
    colums = [
    
            {path: "ticker", label: "Ticker"},
            {path: "action", label: "Action"},
            {path: "quantity", label: "Quantity"},
            {path: "date_executed", label: "Date"},
            {path: "unit_price_executed", label: "Unit/price"},
            {path: "total_cost", label: "Total Cost"},
    ]
    
    
    render() { 

        const { userHistory, onSort, sortColumn }= this.props;
        return (
            <Tablehis columns={this.colums}
                       data = {userHistory}
                       sortColumn= {sortColumn}
                       onSort = {onSort}
            />
          );
    }
}
 
export default HistoryTable;