import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#0f63a5",
      light: "rgba(218, 46, 49, 0.1)",
      dark: "rgba(218, 46, 49, 0.8)",
    },
    secondary: {
      main: "#aaaaad",
      light: "rgba(11, 120, 183, 0.1)",
      dark: "rgba(11, 120, 183, 0.8)",
    },
    warning: {
      main: "#30779d",
      light: "rgba(218, 46, 49, 0.1)",
      dark: "rgba(218, 46, 49, 0.8)",
    },
    info: {
      main: "#ffffff",
      light: "rgba(255, 255, 255, 0.1)",
      dark: "rgba(255, 255, 255, 0.8)",
    },
    background: {
      default: "#ffffff",
      // default: 'transparent',
    },
    common: {
      black: "#000000",
      white: "#ffffff",
    },
  },
  typography: {
    fontFamily: 'Gilroy, Poppins, sans-serif', 
    button: {
      textTransform: "none",
      fontSize: "12px",  // Decreased from 14px
    },
    h1: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "30px", 
      color: "#000000",
  
    },
    h2: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "26px",
      color: "#000000",
   
    },
    h3: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "24px", 
      color: "#000000",
  
    },
    h4: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "22px",  // Decreased from 20px
      color: "#000000",
   
    },
    h5: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "20px",  // Decreased from 16px
      color: "#000000",
  
    },
    h6: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "18px",  // Decreased from 14px
      color: "#000000",

    },
    subtitle1: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "16px",  // Decreased from 18px
      color: "#000000",
      opacity: "85%",

    },
    subtitle2: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "14px",  // Decreased from 16px
      color: "#000000",
      opacity: "85%",

    },
    body1: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "16px",  // Decreased from 14px
      color: "#000000",
   
    },
    body2: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "14px",  // Decreased from 12px
      color: "#000000",
 
    },
    caption: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "12px",   // Decreased from 10px
      color: "#000000",

    },
    overline: {
      fontFamily: 'Gilroy, Poppins, sans-serif',
      fontSize: "10px",   // Decreased from 8px
      color: "#000000",
    },
  },  
  
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#aaaaad",
            color: "#000000",
            border: "1px solid #0f63a5",
          },
          textTransform: "capitalize",
          fontFamily: 'Gilroy, Poppins, sans-serif',
          fontSize: "14px",
          borderRadius: "8px",
          height: "38px",
          padding: "8px 20px",
          width: "auto",
          color: "#ffffff",
          backgroundColor: "#0f63a5",

        },
        outlined: {
          '&:hover': {
            color: '#000000',
            border: "1.5px solid #aaaaad",
            backgroundColor: '#aaaaad',
            '& img': {
              filter: 'brightness(0) invert(1)',
            },
            '& .MuiTypography-root': {
              color: 'white',
            },
          },
          textTransform: "capitalize",
          fontFamily: 'Gilroy, Poppins, sans-serif',
          fontSize: "14px",
          borderRadius: "8px",
          height: "38px",
          padding: "8px 20px",
          width: "auto",
          border: "1.5px solid #aaaaad",
          backgroundColor: '#ffffff',
          color: '#aaaaad',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          '& fieldset': {
            borderRadius: '10px',
          },
          '& input::placeholder': {
            fontSize: '14px',
            fontFamily: 'Gilroy, Poppins, sans-serif',
          },
          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            display: 'none',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          color: "#000000",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          color: "#000000",
          opacity: "70%",
          fontSize: "20px",
        },
        shrink: ({ ownerState }) => ({
          ...(ownerState.shrink && {
            fontSize: "18px !important",
          }),
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          fontSize: "18px",
          lineHeight: "27px",
          color: "#000000",
        },
        notchedOutline: {
          borderColor: "#ccc",
        },
        root: {
          background: "white",
          "&.Mui-focused": {
            background: "#F8F8F9",
            boxShadow: "0px 6px 12px #3C599829",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          color: "#000000",
          fontSize: "16px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: "0px 2px 10px #0000001A",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 5px 20px #0000001A",
          borderRadius: "10px",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: "0px 5px 20px #0000001A",
          borderRadius: "8px",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          color: "#000000",
          fontSize: "18px",
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          fontSize: "18px",
          color: "#000000",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
        },
        option: {
          fontFamily: 'Gilroy, Poppins, sans-serif',
          fontSize: "18px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#000000", // Ensure default color is black
          fontFamily: 'Gilroy, Poppins, sans-serif',
        },
      },
    },
  },
});
