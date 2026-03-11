type ReportModel = {
  date: string;
  equipment?:
    | string
    | {
        id: string;
        name: string;
        location: { id: string; name: string; base_location_name: string; base_location: string } | null;
      }
    | null;
  applicant?: string | { id: string; name: string } | null;
  reason_call: string;
  job_description: string;
  root_cause: string;
  executors?: ExecutorModel[];
  applicantName: string;
  executorNames: string;
  isMarked?: boolean;
  rowNum: number;
};

type ExecutorModel = { id: string; fullname: string };
