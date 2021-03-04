import React, { Component } from 'react';
import ReactApexChart from "react-apexcharts";
import {PortfolioData,DateArray,TotalValue} from '../services/formatDayandTime'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
class GrowthChart extends Component {
    
    async componentDidMount() {
        
        try
        {
            const Alldata =  await PortfolioData();
            const data = Alldata.data.portfolioGrowth;
            
            const valueArray = TotalValue(data)
            const dateArr = DateArray(data);
           
            let options = {...this.state.options}
            options.xaxis= { categories: dateArr}


            let series = {...this.state.series}
            series= [{ name: "USD" , data: valueArray}]
            
            this.setState({series:series, options:options})
            
        }catch(e)
        {
            this.setState({error:"There is error occur when connecting to server"})
            
        }
    }

    state = {
        error: undefined,
        series: [{
            name: "USD",
            data: [1 ,23 , 5345, 545, 5435, 6656, 45213]
        }],
        options: {
          colors: ['#546E7A'],
          chart: {
            height: 350,
            type: 'line',
            zoom: {
              enabled: false
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          title: {
            text: 'Portfolio Growth',
            align: 'left'
          },
          grid: {
            row: {
              colors: ['transparent' , 'transparent'], // takes an array which will be repeated on columns
              opacity: 0.5
            },
          },
          xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          }
        },
      
      
      };
     
    render() { 

        const error= this.state.error;
        const totalValueArray = this.props.items.map( it =>{
            return parseFloat(it.quantity) * parseFloat(it.price_per_share)
          })
          const TotalValue= totalValueArray.reduce((a, b) => a + b, 0).toFixed(3)
          

        return (  
            <div>
                { !error && (<React.Fragment>
                    <h2> Total Value  &nbsp;
                        <Badge variant="success">{Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'USD' }).format(TotalValue)}</Badge>
                    </h2>
                    <div id="chart">
                        <ReactApexChart options={this.state.options} series={this.state.series} type="line" height={350} />
                    </div>
                </React.Fragment>)}

                { error && (<React.Fragment>
                    <Alert key={"CannotShowPorfoilioChart"} variant={'danger'}>
                        Sorry. Cannot Produce Portfolio Chart. {error}
                    </Alert>
                </React.Fragment>)}

            </div>
            
        );
    }
}
 
export default GrowthChart;