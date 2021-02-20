import React, { Component } from 'react';
import {lookUpTicker} from '../services/tickerService'
import SearchBar from './SearchBar'

class SearchNavBar extends Component{
  constructor(props){
    super(props);
    this.state = {
        isFetching: false,
        ticker: '',
        suggestions: []
    };
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async getSuggestions (ticker) {
      try {
          //const {ticker} = this.state;
          const response  = await lookUpTicker(ticker);
          this.setState({suggestions: response.data.searchResults, errors: response.data, isFetching: true});
          console.log(JSON.stringify(response.data.searchResults));
          
      } catch (ex) {
          if(ex.response|| ex.response.status===404)
          {
              const errors={...this.state.errors};
              console.log(errors);
          }
          this.setState({...this.state, isFetching: false});
      }
  }

  componentWillMount(){
    this.setState({...this.state, isFetching: false});
  }

  handleChange(event){
      const ticker = event.target.value;
      this.setState(prevState => {
        if (ticker === ''){
          const suggestions = [];
          return {ticker, suggestions};
        }
        else{
          const suggestions = this.getSuggestions(ticker)
          return {ticker, suggestions};
        }
  
      });
      //this.setState({ticker: event.target.value})
      //this.getSuggestions();
  };

  handleSubmit(){
      console.log("submit handled");
      alert("a val was submitted: " + this.state.ticker);
  };


  render(){
    const {ticker, suggestions} = this.state;
    return(
    <>
        
          {!this.props.user   &&  (<React.Fragment>
          <div className="justify-content-center">
        <SearchBar
           onChange={this.handleChange}
           value={this.state.ticker}
           suggestions={suggestions}
           onSubmit={this.handleSubmit}
           />
          </div>
          </React.Fragment>)
          }

          {this.props.user    && (<React.Fragment>
            <div className="justify-content-center">
        <SearchBar
           onChange={this.handleChange}
           value={this.state.ticker}
           suggestions={suggestions}
           onSubmit={this.handleSubmit}
           />
          </div>
          </React.Fragment>)
          }
          
    </>

    );
  }
}

export default SearchNavBar
