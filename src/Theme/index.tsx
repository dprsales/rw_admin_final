import { createTheme } from "@mui/material/styles";
import { tokens } from "./tokens";

const {
  bg,
  border,
  gold,
  goldHover,
  goldSoft,
  hover,
  input,
  panel,
  panelAlt,
  text,
  textMuted,
  topbar,
} = tokens;

/** Team RW admin: one dark surface system across every route. */
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: gold,
      light: goldHover,
      dark: tokens.gold,
      contrastText: bg,
    },
    secondary: {
      main: panelAlt,
      light: hover,
      dark: bg,
      contrastText: text,
    },
    warning: {
      main: tokens.warningText,
      light: tokens.warningSoft,
      dark: tokens.warning,
      contrastText: bg,
    },
    info: {
      main: tokens.infoText,
      contrastText: bg,
    },
    success: {
      main: tokens.successText,
      contrastText: bg,
    },
    error: {
      main: tokens.dangerText,
      contrastText: bg,
    },
    text: {
      primary: text,
      secondary: textMuted,
    },
    divider: border,
    background: {
      default: bg,
      paper: panel,
    },
    common: {
      black: bg,
      white: text,
    },
  },
  typography: {
    fontFamily: "Gilroy, Poppins, sans-serif",
    button: { textTransform: "none", fontSize: "13px", fontWeight: 650 },
    h1: { fontSize: "30px", color: text },
    h2: { fontSize: "26px", color: text },
    h3: { fontSize: "24px", color: text },
    h4: { fontSize: "22px", color: text },
    h5: { fontSize: "20px", color: text },
    h6: { fontSize: "18px", color: text, fontWeight: 650 },
    subtitle1: { fontSize: "16px", color: text },
    subtitle2: { fontSize: "14px", color: textMuted },
    body1: { fontSize: "15px", color: text },
    body2: { fontSize: "14px", color: textMuted },
    caption: { fontSize: "12px", color: textMuted },
    overline: { fontSize: "10px", color: gold, letterSpacing: "0.12em" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: bg,
          color: text,
          colorScheme: "dark",
        },
        "input, select, textarea": {
          colorScheme: "dark",
        },
        "*:focus-visible": {
          outline: `2px solid ${gold}`,
          outlineOffset: 2,
        },
        "@supports not selector(:focus-visible)": {
          "*:focus": { outline: `2px solid ${gold}`, outlineOffset: 2 },
        },
        "::selection": {
          backgroundColor: goldSoft,
          color: text,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: topbar,
          color: text,
          boxShadow: "none",
          borderBottom: `1px solid ${border}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          fontSize: "14px",
          fontWeight: 650,
          borderRadius: "10px",
          minHeight: 38,
          padding: "8px 18px",
        },
        contained: {
          color: bg,
          backgroundColor: gold,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: goldHover,
            color: bg,
            boxShadow: "0 4px 14px rgba(195,155,83,0.18)",
          },
          "&.Mui-disabled": {
            color: "rgba(245,242,236,0.35)",
            backgroundColor: "rgba(195,155,83,0.28)",
          },
        },
        containedPrimary: { color: bg },
        containedSecondary: {
          color: text,
          backgroundColor: panelAlt,
          border: `1px solid ${border}`,
          "&:hover": { backgroundColor: hover, color: text, borderColor: gold },
        },
        containedError: {
          color: text,
          backgroundColor: tokens.danger,
          "&:hover": { backgroundColor: tokens.dangerText, color: bg },
        },
        containedSuccess: {
          color: text,
          backgroundColor: tokens.success,
          "&:hover": { backgroundColor: tokens.successText, color: bg },
        },
        outlined: {
          color: text,
          border: `1px solid ${border}`,
          backgroundColor: "transparent",
          "&:hover": {
            border: `1px solid ${gold}`,
            backgroundColor: goldSoft,
            color: goldHover,
          },
        },
        outlinedPrimary: { color: gold, borderColor: border },
        outlinedError: {
          color: tokens.dangerText,
          border: `1px solid ${tokens.danger}`,
          "&:hover": {
            border: `1px solid ${tokens.danger}`,
            backgroundColor: tokens.dangerSoft,
            color: tokens.dangerText,
          },
        },
        text: {
          color: gold,
          "&:hover": { backgroundColor: goldSoft, color: goldHover },
        },
        textError: {
          color: tokens.dangerText,
          "&:hover": { backgroundColor: tokens.dangerSoft, color: tokens.dangerText },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: textMuted,
          "&:hover": { backgroundColor: hover, color: goldHover },
        },
        colorPrimary: { color: gold },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, color: text, backgroundColor: panelAlt },
        colorPrimary: { backgroundColor: goldSoft, color: goldHover },
        colorSuccess: { backgroundColor: tokens.successSoft, color: tokens.successText },
        colorError: { backgroundColor: tokens.dangerSoft, color: tokens.dangerText },
        colorWarning: { backgroundColor: tokens.warningSoft, color: tokens.warningText },
        colorInfo: { backgroundColor: tokens.infoSoft, color: tokens.infoText },
        outlinedPrimary: { borderColor: border, color: gold },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          color: textMuted,
          "&.Mui-selected": { color: gold },
        },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { backgroundColor: gold } },
    },
    MuiLink: {
      styleOverrides: { root: { color: goldHover } },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "rgba(245,242,236,0.3)",
          "&.Mui-checked": { color: gold },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "rgba(245,242,236,0.3)",
          "&.Mui-checked": { color: gold },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": { color: gold },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: gold },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: hover },
        bar: { backgroundColor: gold },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: gold } },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: textMuted,
          borderColor: border,
          "&.Mui-selected": {
            color: bg,
            backgroundColor: gold,
            "&:hover": { backgroundColor: goldHover },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          "& fieldset": { borderRadius: "10px" },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: { color: text },
        input: { color: text, "&::placeholder": { color: textMuted, opacity: 0.75 } },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: input,
          "&:hover": { backgroundColor: input },
          "&.Mui-focused": { backgroundColor: input },
          "&::before": { borderBottomColor: border },
          "&::after": { borderBottomColor: gold },
        },
        input: { color: text, "&::placeholder": { color: textMuted, opacity: 0.75 } },
      },
    },
    MuiNativeSelect: {
      styleOverrides: {
        icon: { color: textMuted },
        select: { backgroundColor: input, color: text },
      },
    },
    MuiSelect: {
      defaultProps: {
        // Dropdowns should not lock page scroll or leave a click-blocking backdrop.
        MenuProps: {
          disableScrollLock: true,
          hideBackdrop: true,
        },
      },
      styleOverrides: { outlined: { color: text } },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: panel,
          backgroundImage: "none",
          border: `1px solid ${border}`,
          borderRadius: "12px !important",
          boxShadow: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 52,
          paddingLeft: 16,
          paddingRight: 16,
          "&.Mui-expanded": { minHeight: 52 },
        },
        content: {
          alignItems: "center",
          margin: "12px 0",
          "&.Mui-expanded": { margin: "12px 0" },
        },
        expandIconWrapper: { color: textMuted },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 0,
          paddingBottom: 16,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          color: textMuted,
          "&.Mui-focused": { color: gold },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          fontSize: "15px",
          color: text,
          "@media (max-width:600px)": { fontSize: "16px" },
        },
        notchedOutline: { borderColor: border },
        root: {
          background: input,
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: border },
          "&.Mui-focused": {
            background: input,
            boxShadow: "none",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: gold },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          color: text,
          fontSize: "14px",
          "&.Mui-selected": { backgroundColor: goldSoft },
          "&.Mui-selected:hover": { backgroundColor: goldSoft },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          color: text,
          backgroundColor: panel,
        },
        outlined: {
          borderColor: border,
          backgroundColor: panelAlt,
        },
        elevation1: { boxShadow: tokens.shadow },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: tokens.shadowSoft,
          borderRadius: "12px",
          border: `1px solid ${border}`,
          backgroundColor: panel,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: panelAlt,
          "& .MuiTableCell-head": {
            color: text,
            fontWeight: 700,
            borderBottom: `1px solid ${border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: border,
          color: text,
          fontSize: "13px",
          padding: "12px 16px",
          "@media (max-width:600px)": {
            padding: "10px 12px",
            fontSize: "12px",
            whiteSpace: "nowrap",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { WebkitOverflowScrolling: "touch" } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
          "&:hover": { backgroundColor: hover },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          color: textMuted,
          "&:hover": { color: gold },
          "&.Mui-active": { color: `${gold} !important` },
        },
        icon: { color: `${goldHover} !important` },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: `1px solid ${border}`, color: textMuted },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderColor: border, backgroundColor: panel },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
          border: `1px solid ${border}`,
          backgroundColor: panel,
          boxShadow: tokens.shadowStrong,
          backgroundImage: "none",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: { root: { backgroundColor: "rgba(0,0,0,0.72)" } },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "18px", color: text, padding: "20px 24px 8px" },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "12px 24px 4px" } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "16px 24px 20px", gap: "8px" } },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
      styleOverrides: {
        paper: {
          backgroundColor: tokens.menu,
          boxShadow: tokens.shadow,
          borderRadius: "12px",
          border: `1px solid ${tokens.borderStrong}`,
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
        // Avoid a full-screen modal layer that blocks clicks after the menu closes.
        hideBackdrop: true,
      },
      styleOverrides: {
        paper: {
          backgroundColor: tokens.menu,
          borderRadius: "12px",
          border: `1px solid ${tokens.borderStrong}`,
          boxShadow: tokens.shadow,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: "Gilroy, Poppins, sans-serif",
          color: textMuted,
          "&.Mui-focused": { color: gold },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: { label: { color: text } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: "2px", fontSize: "11.5px" } },
    },
    MuiInputBase: {
      styleOverrides: {
        input: { "&::placeholder": { color: textMuted, opacity: 0.75 } },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: tokens.overlay, borderRadius: "8px" },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: panelAlt,
          color: text,
          fontSize: "11.5px",
          borderRadius: "8px",
          border: `1px solid ${border}`,
          padding: "6px 10px",
          boxShadow: tokens.shadow,
        },
        arrow: { color: panelAlt },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        option: { fontSize: "14px" },
      },
    },
    MuiTypography: {
      styleOverrides: { root: { fontFamily: "Gilroy, Poppins, sans-serif" } },
    },
    MuiAlert: {
      styleOverrides: {
        standardInfo: { backgroundColor: tokens.infoSoft, color: text },
        standardSuccess: { backgroundColor: tokens.successSoft, color: text },
        standardWarning: { backgroundColor: tokens.warningSoft, color: text },
        standardError: { backgroundColor: tokens.dangerSoft, color: text },
      },
    },
  },
});
