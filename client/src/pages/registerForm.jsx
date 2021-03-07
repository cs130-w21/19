<<<<<<< HEAD:client/src/components/registerForm.jsx
import React  from 'react';
=======
import React from 'react';
>>>>>>> d5ddd73983826058f13120dc4a8c1c86b768e35b:client/src/pages/registerForm.jsx
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import Joi from "joi-browser"
import Form from '../components/common/Form'
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
            localStorage.setItem('show_tutorial_first_time', true);
            window.location="/chart";
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
            <div className= "container" style={{ marginTop: '8rem'}}>
                <Row md={12}>
                <Col md={2}></Col>
                <Col md={8}>
                {/*<h3>Register Form</h3>*/}
                <h2 className="text-dark"> &nbsp; Sign up to get started! </h2>
                <form onSubmit={this.handleSubmit}>
                    {this.renderInput("username", "", "text", "Enter Username")}
                    {this.renderInput("password", "", "password", "Enter Password")}
                    {this.renderInput("email", "", "text", "Enter Email")}
                   {this.renderButton("Sign Up")}
                </form>
                </Col>
                </Row>
            </div>
          );
    }
}
 
export default RegisterForm;
