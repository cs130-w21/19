import  {Component} from 'react';
import Store from 'store'
class Logout extends Component {

    componentDidMount() {
        Store.remove('user');
        window.location ="/";
    }
    
    render() { 
        return ( <> </>);
    }
}
 
export default Logout;
