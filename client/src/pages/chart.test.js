import React from 'react'
import {mount, shallow} from 'enzyme'
import ChartComponent from './chart'
import {act} from 'react-dom/test-utils'


jest.mock('../services/watchlistService', () => {
    return {
        __esModule: true,
        getWatchlist: async() => [
            {
                ticker: "MICR",
                company_name: "MICRON SOLUTIONS INC",
                last_price: "50.40",
                price_per_share: "50.40",
                date_added: "2021-03-02T01:22:47.086Z"
            }
        ]
    }
})

jest.mock('../services/portfolioService', () => {
    return {
        __esModule: true,
        getPortfolioItems: async() => [
            {
                symbol: "MSFT",
                company_name: "MICROSOFT CORP",
                quantity: "50",
                price_per_share: "100",
                date_changed: "2021-03-02T01:22:47.086Z"
            }
        ]
    }
})


describe('ChartComponent tests', () => {
    require('../services/portfolioService');
    require('../services/watchlistService');
    it('should put/delete an item in the watchlist if star is filled/unfilled',async () => {
        //require('../services/portfolioService');
        //require('../services/watchlistService');
        /*const watchlistItemsVal = [
            {
               
                ticker: "MICR",
                company_name: "MICRON SOLUTIONS INC",
                last_price: "50.40",
                price_per_share: "50.40",
                date_added: "2021-03-02T01:22:47.086Z"
            }
        ]*/
        //const isWatchlistSelected= true;
        //const tickerVal = "MICR";
        //const companyNameVal = "MICRON SOLUTIONS INC";

      
        
        //const wrapper = mount(<ChartComponent/>)
        //expect(wrapper.html()).toMatchSnapshot();
        //const instance = wrapper.instance();
        /*instance.setState({
            isWatchlistSelected: true,
            ticker: tickerVal,
            companyName: companyNameVal,
            data: undefined,
            watchlistItems: [],
            portfolioItems: [],
            isLogin: false
        })*/
        //instance.componentDidMount();
        //console.log(instance.state);
        //console.log(wrapper.html());


    })
})
