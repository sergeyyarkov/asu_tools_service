export type ReportColumns = {
  id?: number | string;
  date: Date;
  reason_call: string;
  job_description: string;
  root_cause: string | null;
  applicant_id: number | string | null;
  equipment_id: number | string | null;
};

export type ReportExecutorTableCols = { id: string | number; report_id: string | number; user_id: string | number };

export type SystemModelTableCols = {
  id: string | number;
  name: string | null;
  location_id: string | number | null;
};
