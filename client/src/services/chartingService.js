import http from "./httpService";
import { apiUrl } from "../config.json";

const apiEndpoint = apiUrl + "/chart";

export function getData(begin, end, ticker, resolution) {
	return http.get(apiEndpoint + "?from=" + begin + "&to=" + end + "&ticker=" + ticker + "&resolution=" + resolution);
}