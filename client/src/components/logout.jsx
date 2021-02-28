import React, { Component } from 'react';
import Store from 'store'
class Logout extends Component {

    componentDidMount() {
        Store.remove('user');
        window.location ="/";
    }
    
    render() { 
        return ( null  );
    }
}
 
export default Logout;