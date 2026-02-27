import yup from "yup";

var reportItemSchema = yup.object({
  date: yup.date().required(),
  equipment: yup.string().nullable().required(),
  reason_call: yup.string().required(),
  job_description: yup.string().required(),
  root_cause: yup.string().required(),
  applicant: yup.number().required(),
  executor_ids: yup.array(yup.number()).required(),
});

/** @type {HTTPRouteHandler} */
export default async ({ res, data }) => {
  const inputSchema = yup.object({ reports: yup.array(reportItemSchema).required() }).required();

  await inputSchema.validate(data);
  res.sendJson({ data });
};
