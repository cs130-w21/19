import React, { Component } from 'react';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {getPortfolioItems} from "../services/portfolioService.js"
import Portfolio from "../components/Portfolio"
import History from "./myHistory"
import { Doughnut } from 'react-chartjs-2'
import {createChartInput} from '../utils'
import GrowthChart from '../pages/profolioChart'
import Store from 'store';

class Profile extends Component{
    constructor(props){
        super(props);
        this.state = {
            isFetching: false,
            isGrowthChartSelected: true,
            isPortfolioSelected: true,
            items: [],
            chartstate: {
              labels: [],
              datasets: []
            },
        };
    }
    async fetchItems() {
        try {
            this.setState({...this.state, isFetching: true});
            const response = await getPortfolioItems();
            this.setState({items: response.data.portfolioItems, isFetching: false});
        } catch (e) {
            console.log(e);
            this.setState({...this.state, isFetching: false});
        }
    };
    
    componentDidMount() {
      this.fetchItems();     
    }

    render() {
      //console.log(new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(Date.now()));
      const user = Store.get('user');
      const {items = [], isGrowthChartSelected, isPortfolioSelected} = this.state;
      const chartinput = createChartInput(items);
      console.log(items);
      return (
        <Container style={{ marginTop: '2rem'}}>
        <Row md={12}>
        <Col md={1}></Col>
        <Col md={10}>
        <h2 className="text-dark text-center"> &nbsp; Hi {user}! </h2>
        
        <Row></Row>
        <Tabs style={{ marginTop: '2rem'}}
              activeKey={isPortfolioSelected ? 'Portfolio': 'History'}
              onSelect={(k) => this.setState({ isPortfolioSelected: k === 'Portfolio' })}
            >
        <Tab eventKey="Portfolio" title="Your Portfolio">
        <Row md={12}>
        <Col md={1}></Col>
        <Col md={10}>
        {/*<h2 className="text-dark"> &nbsp; {user}'s Portfolio </h2>*/}
        <Portfolio items={items} titleLess={true} light isLoggedIn={!!user} enableClick={false}/>
        </Col></Row>
        <Row md={12}>
        <Col md={1}></Col>
        <Col md={10}>
            <Tabs
              activeKey={isGrowthChartSelected ? 'Portfolio Growth': 'Portfolio Distribution'}
              onSelect={(k) => this.setState({ isGrowthChartSelected: k === 'Portfolio Growth' })}
            >
              <Tab eventKey="Portfolio Growth" title="Portfolio Growth">
                <GrowthChart items={items}/>
              </Tab>
              <Tab eventKey="Portfolio Distribution" title="Portfolio Distribution">
                <Doughnut
                  data={chartinput}
                  options={{
                  title:{
                    display:true,
                    text:'Share Distrbution in Portfolio',
                    fontSize:20
                  },
                  legend:{
                    display:true,
                    position:'right'
                  }
                }}
              />
              </Tab>
            </Tabs>
          </Col>
          </Row>
          </Tab>
          <Tab eventKey="History" title="Your Trading History">
          <Row md={12}  style={{ marginTop: '2rem'}}>
            <Col md={1}></Col>
            <Col md={10}>
              <History/>
            </Col>
          </Row>
        </Tab>
        </Tabs>
        </Col>
        </Row>
          </Container>
      );
  }
}

export default Profile;

