import React, { Component } from 'react';
import Store from 'store'
import HistoryTable from './HistoryTable'
import { paginate } from "../components/common/paginate";
import Pagination from "../components/common/pagination";
import _ from "lodash"
import * as getUserHistoryData from "../services/getUserData"
import Alert from 'react-bootstrap/Alert'
//just for testing


class Histroy extends Component {
    
    
    state = { 
        userHistory:[],
        currentPage: 1,
        pageSize: 5,
        sortColumn: { path: "ticker", order: "asc" },
        error:[],
        
      };

    // async componentDidMount() {
    //     const userHistroy = await getUserHistory.getUserHistoryData(user)
    // }
    
    async componentDidMount() {
        
        try
        {
            const backEndData =  await getUserHistoryData.getUserHistoryData();
            const userHistory =  backEndData.data.Trades;
    
            const userHistory1 = userHistory.map(
            function(item)  
            { 
                item.quantity = parseFloat(item.quantity);
                item.unit_price_executed = parseFloat(item.unit_price_executed);
                return item;
            });
        
            const totalCost = userHistory1.map((item) => (  Object.assign( item, { total_cost: (item.quantity * item.unit_price_executed).toFixed(2) })));
            this.setState({userHistory: totalCost})
        }
        catch(e)
        {
            const error = "Cannot Connect to the database"; 
            this.setState({error:error});
            console.log(  "this is error " + this.state.error)
        }
        
    }

    handleSort = sortColumn => {
        this.setState({sortColumn});
    }
    
    handlePageChange = page => {
        this.setState({ currentPage: page });
    };
    
    getPagedData = () => {
        const {
            pageSize,
            currentPage,
            sortColumn,
            userHistory: allHistory
        } = this.state;


        const sorted  = _.orderBy(allHistory, [sortColumn.path],[sortColumn.order] ) 
        const userHistory = paginate(sorted, currentPage, pageSize);
        return {totalCount: allHistory.length, data: userHistory};
    }


    render() { 

        const user =  Store.get('user')
        const history_title = "Purchase History of " + user;
        //const userHistroy = getUserHistory.getUserHistoryData(user)

        const count = this.state.userHistory.length;
        const { pageSize, currentPage, sortColumn } = this.state;
        if (count === 0) return (
            <div>
                <h1>{history_title} </h1>
                <p>There are no history of transaction.</p>

            </div>
            );
        
        const {totalCount, data: userHistory} = this.getPagedData();
        
        if(!this.state.error)
        {
            return (
                <div>
                <h1>
                    {history_title}
                    <Alert variant="danger">
                        {this.state.error}
                    </Alert>
                </h1>
                </div>
            )
        }

        return (
            <div>
                <h1>
                    {history_title}
                </h1>

            <div className="col">
                <p>Showing {totalCount} result from History.</p>
                <HistoryTable
                    userHistory={userHistory}
                    sortColumn={sortColumn}
                    onSort={this.handleSort}
                />
                <Pagination
                    itemsCount={totalCount}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onPageChange={this.handlePageChange}
                />
              
            </div>
            </div>


          );
    }
}
 
export default Histroy;