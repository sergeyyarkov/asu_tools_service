/** @param {string} str */
export const isStrLink = (str) => RegExp(/^(https?:\/\/|file:\/\/)/gm).test(str);
