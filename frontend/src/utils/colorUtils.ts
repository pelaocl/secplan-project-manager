// En frontend/src/utils/colorUtils.ts (o donde tengas getUserAvatarColor)
const VIBRANT_AVATAR_COLORS = [
  '#FF6F61', // Coral Vivo
  '#6B5B95', // Púrpura Intenso
  '#88B04B', // Verde Fresco
  '#F7CAC9', // Rosa Suave (puede ser vibrante en contraste)
  '#92A8D1', // Azul Sereno
  '#955251', // Marrón Rojizo
  '#B565A7', // Orquídea
  '#009B77', // Verde Menta Oscuro
  '#DD4124', // Rojo Mandarina
  '#45B8AC', // Turquesa
  '#EFC050', // Amarillo Dorado
  '#5B5EA6', // Azul Índigo Profundo
  '#9B2335', // Rojo Vino
  '#DFCFBE', // Beige (como neutro vibrante si se usa bien)
  '#55B4B0'  // Verde Azulado Suave
];

export const getUserAvatarColor = (userId: number | string): string => {
  let idAsNumber = 0;
  if (typeof userId === 'string') {
    // Un hash simple del string para obtener un número
    for (let i = 0; i < userId.length; i++) {
      idAsNumber = (idAsNumber << 5) - idAsNumber + userId.charCodeAt(i);
      idAsNumber |= 0; // Convertir a entero de 32bit
    }
  } else {
    idAsNumber = userId;
  }
  // Usamos Math.abs para asegurar un índice positivo
  const colorIndex = Math.abs(idAsNumber) % VIBRANT_AVATAR_COLORS.length;
  return VIBRANT_AVATAR_COLORS[colorIndex];
};