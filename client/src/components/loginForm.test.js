import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import LoginForm from '../components/loginForm';

describe('loginForm', () => {

    it('should display heading', () => {
        const wrapper = shallow(<LoginForm/>);
        const s = wrapper.find('div h3');
        expect(s.text()).toBe('Login Form');
        
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