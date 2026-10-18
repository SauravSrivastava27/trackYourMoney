
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  reportingPeriod: "month" | "quarter" | "year";
};

const initialState: UiState = {
  reportingPeriod: "month",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setReportingPeriod(
      state,
      action: PayloadAction<UiState["reportingPeriod"]>
    ) {
      state.reportingPeriod = action.payload;
    },
  },
});

export const { setReportingPeriod } = uiSlice.actions;
export default uiSlice.reducer;
