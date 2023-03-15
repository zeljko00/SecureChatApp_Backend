import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
export const CustomTextField = styled(TextField)(({ theme }) => ({
  input: { color: "white" },
  label: { color: "white" },
  "&:hover": {
    fieldset: {
      borderColor: "#1976d2 !important",
    },
    label: { color: "#1976d2" },
  },
  fieldset: {
    borderColor: "white",
  },
}));
