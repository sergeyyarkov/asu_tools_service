import y from "yup";

export const reportItemSchema = y.object({
  date: y.string(),
  equipment: y
    .object({
      id: y.number(),
      name: y.string(),
      location: y
        .object({
          id: y.string(),
          name: y.string(),
          base_location_name: y.string(),
          base_location: y.string()
        })
        .nullable()
    })
    .nullable(),
  reason_call: y.string(),
  job_description: y.string(),
  root_cause: y.string(),
  applicant: y.object({ id: y.number(), name: y.string() }).nullable(),
  executors: y.array(y.object({ id: y.number(), fullname: y.string() })).required()
});

export const reportsSchema = y.object({ reports: y.array(reportItemSchema).required() }).required();
