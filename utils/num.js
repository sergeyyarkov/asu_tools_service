export function range(from = 0, to = 1) {
  const ret = [];

  to++;

  for (const idx of Array(to - from).keys()) {
    ret[idx] = from + idx;
  }

  return ret;
}
