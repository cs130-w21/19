import React, { Component } from 'react';
import { Doughnut } from 'react-chartjs-2'


class PieChart extends Component{
    
    render(){
        const {piestate} = this.props;
        return (
            <div>
            <Doughnut
            data={piestate}
            options={{
              title:{
                display:true,
                text:'Average Rainfall per month',
                fontSize:20
              },
              legend:{
                display:true,
                position:'right'
              }
            }}
          />
          </div>
        );
    }
}

export default PieChart;