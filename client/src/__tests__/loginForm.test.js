import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
import LoginForm from '../pages/loginForm';

describe('loginForm', () => {

    it('should display heading', () => {
        const wrapper = shallow(<LoginForm/>);
        const s = wrapper.find('div h2');
        expect(s.text()).toBe('Already a user? Sign in!');
        
    })


    it('should display button', () => {
        const wrapper = shallow(<LoginForm/>);
        const s = wrapper.find('button');
        expect(s.exists()).toBe(true);        
    })

    it('should contain input', () => {
        const wrapper = shallow(<LoginForm/>);
        const s = wrapper.find('Input');
        
        expect(s.exists()).toBe(true);        
    })

})