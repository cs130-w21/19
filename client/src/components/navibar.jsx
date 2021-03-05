import React, { Component } from 'react';
import { useLocation, Link, NavLink } from "react-router-dom";
import Tutorial from './Tutorial';

class NavBar extends Component{

  constructor(props) {
    super(props);
  }

  render(){
    const { location } =this.props;
    const isInProfilePage = location.pathname === '/myProfile';
    return(
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <Link className = "navbar-brand" to="/">
            Stonks
        </Link>
        <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
        </button>
        <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/chart">
            Market
          </NavLink></div>
          {!this.props.user   &&  (<React.Fragment>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNavAltMarkup">
        <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/login">
            Sign In
          </NavLink>
          <NavLink className="nav-item nav-link" to="/register">
            Sign Up
          </NavLink></div></div>
          </React.Fragment>)
          }

          {this.props.user    && (<React.Fragment>
            <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/myProfile">
            Profile
          </NavLink> </div>
      
          
          <div className="collapse navbar-collapse justify-content-end" id="navbarNavAltMarkup">
            
          <div className="navbar-nav" >
          {this.props.user && <Tutorial isProfile={isInProfilePage} />}
          <NavLink className="nav-item nav-link" to="/logout">
            Logout
          </NavLink></div></div>
          </React.Fragment>)
          }
    </nav>

    );
  }
}

const NavBarWithLocation = (props) => {
  const location = useLocation();
  return (
    <NavBar location={location} {...props} />
  );
}

export default NavBarWithLocation;
