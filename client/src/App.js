import React, { Component } from 'react';
import LoginForm from "./components/loginForm"
import RegisterForm from "./components/registerForm"
import NavBar from "./components/navibar"
import SearchNavBar from "./components/searchNavbar"
import { Route, Switch } from "react-router-dom";
import ChartPage from "./pages/chart"
import ProfilePage from "./pages/myProfile"
import Store from 'store'
import Logout from './components/logout';
import './styles/app.css';
import WelcomeComponent from './pages/welcome';


class App extends Component {
  state = { user:undefined }

  componentDidMount() {
    
    try{
      const user = Store.get('user');
      console.log(user)
      this.setState({user:user})
    }catch(ex)
    {}
    
  };

  render() { 
        return ( 
      <React.Fragment>
      <NavBar user={this.state.user} />
      <main className= "container">
        <Switch>
        <Route path= "/login" component={LoginForm} />
        <Route path= "/register" component={RegisterForm} />
        <Route path= "/logout" component={Logout}/>
        <Route path= "/chart" component={ChartPage} />
        <Route path= "/myProfile" component={ProfilePage} />
        <Route path= "/" component={WelcomeComponent} />

        </Switch>
      </main>
    </React.Fragment>
     );
  }
}
 

export default App;
