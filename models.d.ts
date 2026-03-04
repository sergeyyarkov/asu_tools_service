type ReportModel = {
  date: string;
  equipment?: string | { id: string; name: string } | null;
  applicant?: string | { id: string; name: string } | null;
  reason_call: string;
  job_description: string;
  root_cause: string;
  executors?: ExecutorModel[];
  applicantName: string;
  executorNames: string;
  isMarked?: boolean;
};

type ExecutorModel = { id: string; fullname: string };
