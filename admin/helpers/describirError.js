/**
 * Resumen seguro de un error de petición para la consola: solo estado y mensaje.
 * Nunca se registra el error completo: el cliente de Strapi guarda en él la config
 * de la petición, que incluye el header Authorization del admin.
 */
const describirError = (error) => ({
  status: error?.response?.status,
  message: error?.response?.data?.error?.message || error?.message,
});

export default describirError;
