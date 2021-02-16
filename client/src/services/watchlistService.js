import {apiUrl} from "../config.json";
import http from "./httpService";

const apiEndpoint= apiUrl+ "/watchlist";

export function getWatchlist() {
    return http.get(apiEndpoint);
}

export function addToWatchlist(ticker) {
    return http.put(apiEndpoint+ `/${ticker}`, {
        ticker,
    });
}

export function deleteFromWatchlist(ticker) {
    return http.delete(apiEndpoint+ `/${ticker}`, {
        ticker,
    });
}
