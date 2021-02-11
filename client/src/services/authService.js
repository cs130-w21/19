import {apiUrl} from "../config.json";
import http from "./httpService";

const apiEndpoint= apiUrl+ "/accounts";

export function login(username, password)
{
    return http.post(apiEndpoint + '/login', {username, password});
}

export function register(user)
{
    return http.post(apiEndpoint+ '/register', {
        email: user.email, 
        password: user.password,
        username: user.username
    });
}
