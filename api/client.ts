import axios from "axios";

const client = axios.create({
  baseURL: "https://api.agapespringsint.com",
  headers: {
    Accept: "application/json",
  },
});

export default client;
