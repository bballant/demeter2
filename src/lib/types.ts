export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  filename: string | undefined;
};

export type Filter = {
  filename: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
};
