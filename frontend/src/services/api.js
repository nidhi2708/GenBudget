import axios from "axios";

const API = axios.create({
    // For deployment, replace this with your Render backend URL, for example:
    // baseURL: "https://your-render-service.onrender.com/api",
    baseURL: "http://localhost:5000/api",
});

export default API;
