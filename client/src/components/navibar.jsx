import React, { Component } from 'react'; 
import { Link, NavLink } from "react-router-dom";

const NavBar =({user})=> 
{
    
    
    return(
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <Link className = "navbar-brand" to="/">
            Stonk
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
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div className="navbar-nav" >
          <NavLink className="nav-item nav-link" to="/watchlist" >
            Watch List
          </NavLink>
          <NavLink className="nav-item nav-link" to="/chart">
            Chart
          </NavLink>
          <NavLink className="nav-item nav-link" to="/rentals">
            Support
          </NavLink>
          {!user   &&  (<React.Fragment>
          <NavLink className="nav-item nav-link" to="/login">
            Login
          </NavLink>
          <NavLink className="nav-item nav-link" to="/register">
            Register
          </NavLink>
          </React.Fragment>)
          }

          {user    && (<React.Fragment>
          <NavLink className="nav-item nav-link" to="/myProfile">
            {user}
          </NavLink>
          <NavLink className="nav-item nav-link" to="/logout">
            Logout
          </NavLink>
          </React.Fragment>)
          }
          
        </div>
      </div>
    </nav>

    );
}

export default NavBar
