import axios from "axios";

export const API_BASE_URL = "https://api.agapespringsint.com";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

export default client;
