
import {apiUrl} from "../config.json";
import http from "./httpService";
const apiEndpoint= apiUrl+ "/portfolio/growth";

const moment = require('moment'); 

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