import React, { Component } from 'react';
import Joi from "joi-browser"
import Form from './common/Form'
import {login} from '../services/authService'
import Store from 'store'
class LoginForm extends Form {
    
    state = {
        data: {username: '', password: ''},
        error: {}
    }

    schema = 
        {
            username: Joi.string()
                         .required()
                         .label("Username"),
            password: Joi.string()
                         .required()
                         .label("Password")
        }

    doSubmit =async()=> {

        try {
            const {data} = this.state;
            localStorage.setItem('user',data.username );
            await login(data.username, data.password);
            window.location="/chart"
            
            
        } catch (ex) {
            if(ex.response|| ex.response.status===404)
            {
                const errors={...this.state.errors};
                errors.username= ex.response.data.errorMessage;
                this.setState({errors})
            }
        }
       
       if (this.props.successUrl) {
         this.props.history.push(this.props.successUrl);
       }
    }

    render() { 
        return (
            <div>
              <h3>Login Form</h3>
              <form onSubmit={this.handleSubmit}>
                {this.renderInput("username", "Username", "text", "Enter Username")}
                {this.renderInput("password", "Password", "password", "Enter Password")}
                {this.renderButton("Login")}
              </form>
            </div>
          );
    }
}
 
export default LoginForm;
