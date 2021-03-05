import React from 'react';
import {mount, shallow} from 'enzyme';
import Portfolio from '../components/Portfolio';

function onSelectPortfolioItem({ ticker, companyName }){
    if (ticker !== 'USD') {
      //this.props.onSelectStock({ticker, companyName });
      //console.log(ticker)
      //console.log(companyName)
    }
}
describe('Portfolio tests', () => {

    it('should change ticker and company name when table row is clicked on', () => {
        
        const items = [
            {
                symbol: "MSFT",
                company_name: "MICROSOFT CORP",
                quantity: "50",
                price_per_share: "100",
                date_changed: "2021-03-02T01:22:47.086Z"
            }
        ]
        const mockClickCallBack = jest.fn();
        mockClickCallBack.mockImplementation((val) => (val.companyName === "MICROSOFT CORP" && val.ticker === "MSFT"));
        
        const wrapper = mount(<Portfolio items={items} titleLess={true} light={true} onSelectStock={mockClickCallBack} isLoggedIn={true} enableClick={true}/>);
        //console.log(wrapper.html());
        
        wrapper.update();
        const thead = wrapper.find('th').at(0);
        //console.log(thead.html());
        expect(thead.exists()).toBe(true)



        const tr = wrapper.find('tr').at(1);
        //console.log(tr.html());

        tr.simulate('click');
        expect(mockClickCallBack).toHaveBeenCalledWith({ticker: "MSFT", companyName: "MICROSOFT CORP"});
        expect(mockClickCallBack).toHaveReturnedWith(true);
    })

})