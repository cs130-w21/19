import React, { Component } from 'react';
import Chart from '../components/Chart';
import { getData } from "../utils"
import { TypeChooser } from "react-stockcharts/lib/helper";
import Container from 'react-bootstrap/Container';
import BuySellWidget from '../components/buySellWidget';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Store from 'store';

class ChartComponent extends Component {
  componentDidMount() {
    const ticker = 'MSFT';
    const mostRecentPrice = 50.40;
    getData().then(data => {
      this.setState({ data, ticker, mostRecentPrice })
    })
  }
  render() {
    const user = Store.get('user');
    if (this.state == null || !this.state.data) {
      return <div>Loading...</div>
    }
    const { ticker, mostRecentPrice, data } = this.state;
    return (
      <Container style={{ marginTop: '1rem'}}>
        <Row md={12}>
          <Col md={8}>
            <TypeChooser>
              {type => <Chart type={type} data={data} />}
            </TypeChooser>
            </Col>
            <Col md={4}>
              <BuySellWidget ticker={ticker} mostRecentPrice={mostRecentPrice} isLoggedIn={!!user}/>
            </Col>
        </Row>
      </Container>
    )
  }
}
export default ChartComponent;
