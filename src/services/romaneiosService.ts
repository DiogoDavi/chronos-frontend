// import axios from 'axios';

// const api = axios.create({
//   baseURL: '/api'
// });

// export const romaneiosService = {
//   async getDashboardData(filters: any, from?: number, to?: number) {
//     const response = await api.post('/romaneios/dashboard', { filters, from, to });
//     return response.data;
//   },

//   async getFilters() {
//     const response = await api.get('/romaneios/filters');
//     return response.data;
//   },

//   async getPremises() {
//     const response = await api.get('/romaneios/premises');
//     return response.data;
//   }
// };


import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api'
});

export const romaneiosService = {
  async getDashboardData(filters: any, from?: number, to?: number) {
    const response = await api.post('/romaneios/dashboard', { filters, from, to });
    return response.data;
  },

  async getFilters() {
    const response = await api.get('/romaneios/filters');
    return response.data;
  },

  async getPremises() {
    const response = await api.get('/romaneios/premises');
    return response.data;
  }
};