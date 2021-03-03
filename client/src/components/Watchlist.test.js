import React from 'react'
import {mount} from 'enzyme'
import Watchlist from './Watchlist'


describe('Watchlist Tests', () => {

    it('should not display items for a user that has not logged in', () => {
        const WatchlistItems = [
            {
            
                ticker: "MSFT",
                company_name: "MICROSOFT CORP",
                last_price: "50",
                price_per_share: "100",
                date_added: "2021-03-02T01:22:47.086Z"
            }
        ]
        const mockClickCallBack = jest.fn();
        mockClickCallBack.mockImplementation((val) => (val.companyName === "MICROSOFT CORP" && val.ticker === "MSFT"));

        const wrapper = mount(<Watchlist watchlistItems={WatchlistItems} onSelectStock={mockClickCallBack} isLoggedIn={false}/>);
        //console.log(wrapper.html());
        const pText = wrapper.find('div').at(1);
        //console.log(pText.html());
        expect(pText.text()).toBe('Please log in to create some watchlists');
    })

    it('should display items for logged in user and update ticker, company_name', () => {
        const WatchlistItems = [
            {
            
                ticker: "MICR",
                company_name: "MICRON SOLUTIONS INC",
                last_price: "50.40",
                price_per_share: "50.40",
                date_added: "2021-03-02T01:22:47.086Z"
            }
        ]
        const mockClickCallBack = jest.fn();
        mockClickCallBack.mockImplementation((val) => (val.companyName === "MICRON SOLUTIONS INC" && val.ticker === "MICR"));
        const wrapper = mount(<Watchlist watchlistItems={WatchlistItems} onSelectStock={mockClickCallBack} isLoggedIn={true}/>);
        //console.log(wrapper.html());

        const tr = wrapper.find('tr').at(1);
        tr.simulate('click');
        expect(mockClickCallBack).toHaveBeenCalledWith({ticker: "MICR", companyName: "MICRON SOLUTIONS INC"});
        expect(mockClickCallBack).toHaveReturnedWith(true);
    })
})