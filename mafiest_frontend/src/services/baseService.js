import axios from 'axios';
import { BASE_URL } from './config';

const createService = (endpoint) => {
  const baseUrl = `${BASE_URL}${endpoint}`;
  let token = null;

  const setToken = newToken => {
    token = `Bearer ${newToken}`;
  };

  const getConfig = () => {
    return {
      headers: { Authorization: token }
    };
  };

  const getAll = async () => {
    try {
      const config = getConfig();
      const response = await axios.get(baseUrl, config);
      return response.data;
    } catch (error) {
      console.error(`Error getting data from ${endpoint}:`, error);
      throw error;
    }
  };

  const create = async (newObject) => {
    try {
      const config = getConfig();
      const response = await axios.post(baseUrl, newObject, config);
      return response.data;
    } catch (error) {
      console.error(`Error creating in ${endpoint}:`, error);
      throw error;
    }
  };

  const update = async (id, newObject) => {
    try {
      const config = getConfig();
      const response = await axios.put(`${baseUrl}/${id}`, newObject, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating in ${endpoint}:`, error);
      throw error;
    }
  };

  const remove = async (id) => {
    try {
      const config = getConfig();
      const response = await axios.delete(`${baseUrl}/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error deleting from ${endpoint}:`, error);
      throw error;
    }
  };

  return {
    setToken,
    getAll,
    create,
    update,
    remove
  };
};

export default createService;