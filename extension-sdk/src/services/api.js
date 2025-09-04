import axios from "axios";
import { VILLAGE_API_URL } from "../utils/consts";

const api = axios.create({ baseURL: VILLAGE_API_URL });

export default api;
