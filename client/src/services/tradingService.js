import {apiUrl} from "../config.json";
import http from "./httpService";

const apiEndpoint= apiUrl+ "/trading";

export function buy(ticker, quantity) {
    return http.post(apiEndpoint + '/buy', {ticker, quantity});
}

export function sell(ticker, quantity) {
    return http.post(apiEndpoint + '/sell', {ticker, quantity});
}
