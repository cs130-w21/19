import React from 'react'
import {mount} from 'enzyme'
import BuySellWidget from './buySellWidget'


jest.mock('../services/tradingService', () => {
    return {
        __esModule: true,
        buy: async() => ([
            {
                executedPrice: 50.40,
                success: true,
                message: 'order filled',
            }
        ]),
        sell: async() => ([
            {
                executedPrice: 50.40,
                success: true,
                message: 'order filled',
            }
        ]),
    }
})
describe('BuySellWidget Tests', () => {

    require('../services/tradingService');
    it('should not allow trade if user is not logged in', () => {

        const tickerVal = "MSFT"
        const mostRecentPriceVal = 50.40
        
        const wrapper = mount(<BuySellWidget ticker={tickerVal} mostRecentPrice={mostRecentPriceVal} isLoggedIn={false}/>);
        //console.log(wrapper.html());
        
        const textP = wrapper.find('p');
        expect(textP.text()).toBe('Please login/register to trade!');
        
        /* buttons should be disabled for unregistered/signed out users */
        const button = wrapper.find('button').at(1);
        //console.log(button.html());
        expect(button.html().includes('aria-disabled="true"')).toBe(true);
        const button2 = wrapper.find('button').at(2);
        //console.log(button2.html());
        expect(button2.html().includes('disabled=""')).toBe(true);

        /*should't allow user to enter amount */
        const input = wrapper.find('input').at(0);
        //console.log(input.html())
        expect(input.html().includes('disabled=""')).toBe(true);
    })

    it('should display market open/close correctly & actions shud be disabled', () => {
        const tickerVal = "MSFT"
        const mostRecentPriceVal = 50.40
        const wrapper = mount(<BuySellWidget ticker={tickerVal} mostRecentPrice={mostRecentPriceVal} isLoggedIn={true}/>);
        //console.log(wrapper.html());
        const instance = wrapper.instance()
        instance.setState({isMarketOpen: false})
        expect(instance.state.isMarketOpen).toBe(false);
        //wrapper.update();
        //instance.componentDidMount();
        //console.log(wrapper.instance().state.isMarketOpen)
        const badge = wrapper.find('div').at(6)
        //console.log(badge.html());
        expect(badge.text()).toBe('MSFTmarket closed')

        /*note: we allow user to enter amount even when market is closed but buttons are disabled, 
        diff behavior from when user is only logged out */
        /*const input = wrapper.find('input').at(0);
        console.log(input.html());
        //expect(input.html().includes('disabled=""')).toBe(true);*/

        const button2 = wrapper.find('button').at(2);
        //console.log(button2.html());
        expect(button2.html().includes('disabled=""')).toBe(true);
    })
    
    

})