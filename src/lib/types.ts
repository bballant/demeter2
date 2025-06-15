export type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  filename: string | undefined;
};

export type SortOrder = "asc" | "desc";

export type SortBy = "date" | "description" | "amount";

export type Sort = {
  order: SortOrder;
  by: SortBy;
};

export type Filter = {
  filename: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
};
