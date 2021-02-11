import React, { Component } from 'react';
import Joi from "joi-browser"
import Form from './common/Form'
import * as authService from "../services/authService";


class RegisterForm extends Form {
    state = {
        data: {username: '', password: '', email:''},
        error: {}
    }

    schema  = {
        username: Joi.string()
                     .required()
                     .label("Username"),
        password: Joi.string()
                     .required()
                     .min(5)
                     .label("Password"),
        email: Joi.string()
                  .email()
                  .required()
                  .label("Email")

    };

    doSubmit= async() => 
    {
       try{
            const {data} = this.state;
            await authService.register(data);
            localStorage.setItem('user',data.username );
            window.location="/";

       }
       catch (ex){
           if(ex.response && ex.response.status===400)
           {
               const errors = {...this.state.errors};
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
            <div className= "container">
                <h3>Register Form</h3>
                <form onSubmit={this.handleSubmit}>
                    {this.renderInput("username", "Username", "text", "Enter Username")}
                    {this.renderInput("password", "Password", "password", "Enter Password")}
                    {this.renderInput("email", "Email", "text", "Enter Email")}
                    {this.renderButton("Register")}
                </form>

            </div>
          );
    }
}
 
export default RegisterForm;
