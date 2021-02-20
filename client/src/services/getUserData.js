import http from "./httpService";
import { apiUrl } from "../config.json";

export function getUserHistoryData(user) {
  return http.get(apiUrl + "history");
}
