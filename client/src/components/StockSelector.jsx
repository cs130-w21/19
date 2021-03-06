import React from 'react';
import {lookUpTicker} from '../services/tickerService'
import Row from 'react-bootstrap/Row'

import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
const PER_PAGE = 50;


class StockSelector extends React.Component {
  state = {
    isLoading: false,
    options: [],
    suggestions: [],
    query: '',
  };

  _cache = {};

  async makeAndHandleRequest(query, page = 2) {
    const response  = await lookUpTicker(query, 50);
    this.setState({suggestions: response.data.searchResults});
    const {suggestions} = this.state
    const options = suggestions.map(i => ({
      name: i.name,
      symbol: i.symbol,
    }));
    return {options};

  }

  handleStockSelection = (selectedItems) => {
    if(selectedItems.length > 0) {
      this.props.onSelectStock(selectedItems[0]);
    }
  }

  render() {
    return (
      <div className={'tutorial-step-1'} style={{marginTop: "2rem"}}>
      <AsyncTypeahead
        {...this.state}
        style={{
          marginTop: '2%',
          marginRight: '30%',
          marginLeft: '30%',
        }}
        id="async-pagination-example"
        labelKey="name"
        filterBy={() => true}
        maxResults={PER_PAGE - 1}
        minLength={1}
        onInputChange={this.handleInputChange}
        onChange={this.handleStockSelection}
        onPaginate={this.handlePagination}
        onSearch={this.handleSearch}
        paginate
        placeholder="Search Ticker. . ."
        renderMenuItemChildren={option => (
          <div key={option.name}>
           <Row style={{color: "blue"}} className="justify-content-md-left"> 
                            {option.symbol}
            </Row>
            <Row > 
                            {option.name}
            </Row>

          </div>
        )}
        useCache={false}
      />
      </div>
    );
  }

  handleInputChange = query => {
    this.setState({ query });
  };

  handlePagination = (e, shownResults) => {
    const { query } = this.state;
    const cachedQuery = this._cache[query];

    // Don't make another request if:
    // - the cached results exceed the shown results
    // - we've already fetched all possible results
    if (
      cachedQuery.options.length > shownResults ||
      cachedQuery.options.length === cachedQuery.total_count
    ) {
      return;
    }

    this.setState({ isLoading: true });

    const page = cachedQuery.page + 1;

    this.makeAndHandleRequest(query, page).then(resp => {
      const options = cachedQuery.options.concat(resp.options);
      this._cache[query] = { ...cachedQuery, options, page };
      this.setState({
        isLoading: false,
        options,
      });
    });
  };

  handleSearch = query => {
    if (this._cache[query]) {
      this.setState({ options: this._cache[query].options });
      return;
    }

    this.setState({ isLoading: true });
    this.makeAndHandleRequest(query).then(resp => {
      this._cache[query] = { ...resp, page: 1 };
      this.setState({
        isLoading: false,
        options: resp.options,
      });
    });
  };
}

export default StockSelector;
