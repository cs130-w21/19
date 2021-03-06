import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Store from 'store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as outlineStar } from '@fortawesome/free-regular-svg-icons';
import Chart from '../components/Chart';
import { getData } from "../services/chartingService"
import BuySellWidget from '../components/buySellWidget';
import Watchlist from '../components/Watchlist';
import { getWatchlist, addToWatchlist, deleteFromWatchlist } from '../services/watchlistService';
import { getPortfolioItems } from '../services/portfolioService';
import Portfolio from '../components/Portfolio';
import StockSelector from '../components/StockSelector';
import '../styles/app.css';
import { timeParse } from "d3-time-format";

const parseDate = timeParse("%s");

class ChartComponent extends Component {
  defaultState = { 
    isWatchlistSelected: true,
    ticker: 'MSFT',
    companyName: 'MICROSOFT CORP',
    data: undefined,
    watchlistItems: [],
    portfolioItems: [],
    isLogin: false,
    end: Math.floor(Date.now() / 1000),
    hasQueryData: true
  }
  constructor(props) {
    super(props);
    this.state = this.defaultState;
    this.parseFinnhubData = this.parseFinnhubData.bind(this);
  }

  updateWatchlistData = () => {
    getWatchlist().then(({ data: resData }) => {
      const { watchlistItems } = resData;
      this.setState(prevState => {
        return {
          watchlistItems,
        };
      });
    });
  }

  updatePortfolioData = () => {
    getPortfolioItems().then(({ data: resData }) => {
      const { portfolioItems } = resData;
      this.setState({ portfolioItems });
    });
  }

  componentDidMount() {
    const mostRecentPrice = 50.40;
    this.runGetData(this.state.ticker);
    this.updateWatchlistData();
    this.updatePortfolioData();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  changeSelectedStock = ({ ticker, companyName }) => {
    this.setState({
      ticker,
      companyName,
    });

    this.runGetData(ticker);
  }

  toggleWatchlistAdd = async () => {
    const isWatchlisted = this.checkCurrentStockWatchlisted();
    try {
      if (isWatchlisted) {
        await deleteFromWatchlist(this.state.ticker);
      } else {
        await addToWatchlist(this.state.ticker);
      }
      await this.updateWatchlistData();
    } catch (e) {
      // TODO: error
      console.log("ERROR", e);
    }
  }

  checkCurrentStockWatchlisted = () => {
    return this.state.watchlistItems.map((x) => x.ticker).includes(this.state.ticker)
  }

  onTransactionSuccess = () => {
    this.updateWatchlistData();
    this.updatePortfolioData();
  }

  runGetData(ticker) {
    getData(this.state.end - 5097600, this.state.end, ticker, "30").then(({ data }) => {
      this.setState(prevState=> ({
        data,
        hasQueryData: data.hasData,
        mostRecentPrice: data.hasData? data.closes[data.closes.length - 1] : prevState.mostRecentPrice
      }));
    })
  }

  parseFinnhubData(finnhubData) {
    let data = [];
    const { opens, highs, lows, closes, volumes, timestamps, hasData } = finnhubData;
    timestamps.forEach((t, i) => {
      data.push({
        open: opens[i],
        high: highs[i],
        low: lows[i],
        close: closes[i],
        volume: volumes[i],
        date: parseDate(timestamps[i]),
        hasData: hasData
      });
    });
    return data;
  }

  render() {
    const user = Store.get('user');
    const {
      portfolioItems,
      isWatchlistSelected,
      ticker,
      mostRecentPrice,
      companyName,
      data,
      watchlistItems,
    } = this.state || {};

    if (this.state == null || !data) {
      return <div>Loading...</div>
    }
    else if (!this.state.hasQueryData || !mostRecentPrice) {
      return <div>Data error, please try a different ticker.</div>
    }

    const isWatchlisted = this.checkCurrentStockWatchlisted();
    return (
      <>
      <StockSelector onSelectStock={({name, symbol}) => this.changeSelectedStock({ticker: symbol, companyName: name})} />
      <Container style={{ marginTop: '2rem'}}>
        <Row md={12}>
          <Col md={8}>
            <div style={{ fontSize: '1.3em',  display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
              <h3 className={'tutorial-step-2'} style={{ marginLeft: '1.3em', marginRight: '0.3em' }} > {ticker}: { companyName } </h3>
              {user && (<React.Fragment>
                <FontAwesomeIcon
                style={{ marginRight: '1.3em', marginTop: '0.3em', cursor: 'pointer' }}
                icon={isWatchlisted? solidStar: outlineStar}
                onClick={this.toggleWatchlistAdd}
                /> 
                </React.Fragment>)}
                {!user && (<React.Fragment>
                  <FontAwesomeIcon
                    style={{ marginRight: '1.3em', marginTop: '0.3em', cursor: 'pointer' }}
                    icon={outlineStar}
                    onClick={this.toggleWatchlistAdd}
                  />
                </React.Fragment>)}
            </div>
          </Col >
        </Row>
        <Row md={12} >
          <Col md={8}>
          <Chart
                key={this.state.ticker}
                type="hybrid"
                data={this.parseFinnhubData(data)} />
          </Col>
          <Col>
            <BuySellWidget ticker={ticker} mostRecentPrice={mostRecentPrice} isLoggedIn={!!user} onTransactionSuccess={this.onTransactionSuccess}/>
          </Col>
        </Row>
        <Row md={12}>
          <Col md={12}>
            <Tabs className={'tutorial-step-4'}
              activeKey={isWatchlistSelected ? 'watchlist': 'portfolio'}
              onSelect={(k) => this.setState({ isWatchlistSelected: k === 'watchlist' })}
            >
              <Tab eventKey="watchlist" title="Watchlist">
                <Watchlist
                  watchlistItems={watchlistItems}
                  onSelectStock={this.changeSelectedStock}
                  isLoggedIn={!!user}
                />
              </Tab>
              <Tab eventKey="portfolio" title="Portfolio">
                <Portfolio
                  items={portfolioItems}
                  titleLess
                  onSelectStock={this.changeSelectedStock}
                  light
                  isLoggedIn={!!user}
                  enableClick={true}
                />
              </Tab>
            </Tabs>
          </Col>
          <Col md={4}>

          </Col>
        </Row>
      </Container>
      </>
    )
  }
}
export default ChartComponent;
