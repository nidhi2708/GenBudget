import axios from "axios";

const API = axios.create({
    // For deployment, replace this with your Render backend URL, for example:
    baseURL: "https://genbudget.onrender.com/api",
    
});

export default API;
