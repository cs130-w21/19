import React from 'react';
import Joi from "joi-browser"
import Form from './common/Form'
import {login} from '../services/authService'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

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
            
            <div className= "container" style={{ marginTop: '8rem'}}>
                <Row md={12}>
                <Col md={2}></Col>
                <Col md={8}>
                <h2 className="text-dark">Already a user? Sign in!</h2>
              <form onSubmit={this.handleSubmit}>
                {this.renderInput("username", "", "text", "Enter Your Username")}
                {this.renderInput("password", "", "password", "Enter Your Password")}
                {/*<Row md={12}><Col md={4}></Col> <Col md={4}>*/}{this.renderButton("Login")}{/*</Col></Row>*/}
              </form>
              </Col>
              </Row>
            </div>
          );
    }
}
 
export default LoginForm;
