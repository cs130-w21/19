import {apiUrl} from "../config.json";
import http from "./httpService";

const apiEndpoint= apiUrl;

export function lookUpTicker(searchString, maxResults) {
    let encoded_url = encodeURI('?searchString=' + searchString + '&maxResults=' + maxResults);
    return http.get(apiEndpoint + '/search' + encoded_url);
}
