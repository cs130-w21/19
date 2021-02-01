import React, { Component } from 'react';
import Loginform from "./components/loginForm"
import Registerfrom from "./components/registerForm"
import NavBar from "./components/navibar"
import { Route, Redirect, Switch } from "react-router-dom";
import ChartComponent from "./components/chart"



function App() {
  return (
    <React.Fragment>
      <NavBar/>
      <main className= "container">
        <Switch>
          <Route path= "/login" component={Loginform} />
          <Route path= "/register" component={Registerfrom} />
          <Route path= "/chart" component={ChartComponent} />

        </Switch>
      </main>


    </React.Fragment>
  );
}

export default App;
