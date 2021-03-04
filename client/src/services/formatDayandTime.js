
import {apiUrl} from "../config.json";
import http from "./httpService";
import _ from 'lodash'
const apiEndpoint= apiUrl+ "/portfolio/growth";

const moment = require('moment'); 

const dateTest1 = ["2021-03-02T02:00:00.017Z", 
                    "2021-03-02T03:00:00.011Z", 
                    "2021-03-02T04:00:00.011Z", 
                    "2021-03-02T05:00:00.009Z", 
                    "2021-03-02T06:00:00.016Z", 
                    "2021-03-02T07:00:00.031Z", 
                    "2021-03-02T08:00:00.019Z", 
                    "2021-03-02T09:00:00.010Z"]
export function PortfolioData()
{
    return http.get(apiEndpoint );
}

export function TotalValue( TV )
{
    
    const totalValue = TV.map((x)=>{
        return parseFloat(x.total_value)})

    return totalValue;
}

export function DateArray( DArray )
{
   
    const DateArr = DArray.map((x)=>
    {
                return x.date_updated
    })

    const year = DateArr.map((x)=>{
        return (moment(x).get('year'))
    })


    const month = DateArr.map((x)=>{
        return (moment(x).get('month')+1)
    })

    const day = DateArr.map((x)=>{
        return moment(x).get('date')
    })

    const hour = DateArr.map((x)=>{
        return moment(x).get('hour')
    })

    const min =  DateArr.map((x)=>{
        return moment(x).get('min')
    })

    

   if (!checkIsAllArrTheSame(year))
   {
        const value = DateArr.map((x)=>{
            return (moment(x).format('D M YY'))})

        return value;
   }

   if (!checkIsAllArrTheSame(month))
   {
        const value = DateArr.map((x)=>{
            return (moment(x).format('D M'))})
        return value;
   }

   if (!checkIsAllArrTheSame(day))
   {
        const value = DateArr.map((x)=>{
            return (moment(x).format('D HA'))})
        return value;
   }

   else 
   {
        const value = DateArr.map((x)=>{
            return (moment(x).format('HHA MM'))})
        return value;
   }

}

function checkIsAllArrTheSame(x )
{
    const isEqual = x.every(v=> v===x[0])
    return isEqual;

}