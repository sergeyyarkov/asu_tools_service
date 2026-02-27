/** @type {HTTPRouteHandler} */
export default async ({ data, res }) => {
  res.sendJson({ data });
};
