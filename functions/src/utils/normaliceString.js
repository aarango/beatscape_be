// utils/normalizeString.js

/**
 * Normaliza una cadena de texto:
 * - Elimina acentos.
 * - Convierte a minúsculas.
 * - Elimina espacios innecesarios.
 *
 * @param {string} str - La cadena a normalizar.
 * @returns {string} - La cadena normalizada.
 */
function normalizeString(str) {
  return str
    .normalize("NFD") // Descompone los caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .trim() // Elimina espacios al inicio y al final
    .toLowerCase(); // Convierte a minúsculas
}

module.exports = { normalizeString };
