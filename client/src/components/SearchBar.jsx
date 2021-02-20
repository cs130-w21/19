import React, { Component } from 'react';
import Row from 'react-bootstrap/Row'

class SearchBar extends Component {    
    
    render(){
      
        return (
            <React.Fragment>
            <Row className="justify-content-md-center mt-4">
            <input type={"text"} value={this.props.value} placeholder={"Search Ticker"} onChange={this.props.onChange} 
             onSubmit={this.props.onSubmit} />
            <input type="submit" value="Submit"/> </Row>
            {
            this.props.suggestions && this.props.suggestions.length > 0 &&
            <Row className="justify-content-md-center">
            {
                this.props.suggestions.map((suggestion, i) => (
                    <Row className="justify-content-md-center" key={i}> 
                        <Row style={{color: "blue"}} className="justify-content-md-center"> 
                            {suggestion.symbol}
                        </Row>
                        <Row className="justify-content-md-center"> 
                            {suggestion.name}
                        </Row>
                    </Row>
                )
            )}
            </Row>
            }
             
            </React.Fragment>
        );
    }
    
}


export default SearchBar;