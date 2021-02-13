import {apiUrl} from "../config.json";
import http from "./httpService";

const apiEndpoint= apiUrl;

export function getPortfolioItems() {
    return http.get(apiEndpoint + '/portfolio');
}
