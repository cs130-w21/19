import React, { Component } from 'react'; 
import Joi from "joi-browser"
import Input from "./input";

class Form extends Component {
    state = { 
        data: {},
        errors: {}
     }

     validate =()=>{
         const options = {abortEarly:false}; 
         const schema = Joi.object(this.schema)
         const {error} = schema.validate( this.state.data ,options)
         if(!error ) return null;

         const errors = {};
         for( let item of error.details) 
            errors[item.path[0]] = item.message;
         return errors;
     }


    handleSubmit = e => {
        e.preventDefault();
        const errors = this.validate();
        this.setState({errors: errors || {} });
        if(errors) return;
        
        this.doSubmit(); 
    }

    validateProperty = ({ name, value }) => {
        const obj = { [name]: value };
        const schema = Joi.object(  { [name]: this.schema[name] });        
        const { error } = schema.validate(obj);
        return error ? error.details[0].message : null;
    };
    

    handleChange = ({ currentTarget: input }) => {
        const errors = { ...this.state.errors };
        const errorMessage = this.validateProperty(input);
        if (errorMessage) errors[input.name] = errorMessage;
        else delete errors[input.name];
    
        const data = { ...this.state.data };
        data[input.name] = input.value;
    
        this.setState({ data, errors });
    };


    renderButton(label) {
        return (
          <button disabled={this.validate()} className="btn btn-dark">
            {label}
          </button>
        );
    }

    renderInput(name, label, type , placeHolder) {
        const { data, errors } = this.state;
        
        if( errors != null)
        {
            return (
                <Input
                  type={type}
                  name={name}
                  value={data[name]}
                  label={label}
                  onChange={this.handleChange}
                  error={errors[name]}
                />
              );
        }

        return (
          <Input
            type={type}
            name={name}
            value={data[name]}
            label={label}
            onChange={this.handleChange} 
            placeholder = {placeHolder}          
          />
        );
      }
}
 
export default Form;