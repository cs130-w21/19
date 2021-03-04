import React, { Component } from 'react';
import {getPortfolioItems} from "../services/portfolioService.js"
import Portfolio from "../components/Portfolio"
import History from "./myHistory"
import { Doughnut } from 'react-chartjs-2'
import {createChartInput} from '../utils'
import GrowthChart from '../pages/profolioChart'

class Profile extends Component{
    constructor(props){
        super(props);
        this.state = {
            isFetching: false,
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
      const {items = []} = this.state;
      const chartinput = createChartInput(items);
      return (
        <div>
        <Portfolio items={items}/>
        <GrowthChart items={items}/>
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
          <History/>
         
        </div>
      );
  }
}

export default Profile;

