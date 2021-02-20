import React, { Component } from 'react';
import { Link, NavLink } from "react-router-dom";

class NavBar extends Component{
 


  render(){
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
            Chart
          </NavLink></div>
          {!this.props.user   &&  (<React.Fragment>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNavAltMarkup">
        <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/login">
            Login
          </NavLink>
          <NavLink className="nav-item nav-link" to="/register">
            Register
          </NavLink></div></div>
          </React.Fragment>)
          }

          {this.props.user    && (<React.Fragment>
            <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/myProfile">
            {this.props.user}
          </NavLink> </div>
      
          <div className="collapse navbar-collapse justify-content-end" id="navbarNavAltMarkup">
          <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/logout">
            Logout
          </NavLink></div></div>
          </React.Fragment>)
          }
          
    </nav>

    );
  }
}

export default NavBar
