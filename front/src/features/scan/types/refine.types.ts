export type RefineTask = 'LABEL_SCAN' | 'MENU_SCAN';

export interface RefineRequest {
  task: RefineTask;
  textContent: string;
}

export interface RefineResponse {
  status: string;
  data: any;
  rawInput: string;
}
