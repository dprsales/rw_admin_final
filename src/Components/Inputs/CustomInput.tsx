import { styled } from '@mui/material/styles';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import { ReactNode } from 'react';
import React from 'react';
import { tokens } from '../../Theme/tokens';

interface CustomInputProps extends InputBaseProps {
  endAdornment?: ReactNode;
}

const CustomInputWrapper = styled(InputBase)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(2.0),
  },
  '& .MuiInputBase-input': {
    position: 'relative',
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.line}`,
    borderRadius: "6px",
    fontSize: 14,
    padding: '6px 10px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderColor: tokens.gold,
      boxShadow: `0 0 0 3px ${tokens.goldSoft}`,
      backgroundColor: tokens.card,
    },
  },
  '& .MuiInputAdornment-positionEnd': {
    marginLeft: theme.spacing(1),
    position: 'absolute',
    right: "8px",
    fontSize : '14px',
  },
}));

const CustomInput = React.forwardRef<HTMLElement, CustomInputProps>(
  ({ endAdornment, autoComplete = "off", ...other }, ref) => (
    <CustomInputWrapper
      ref={ref}
      {...other}
      autoComplete={autoComplete}
      endAdornment={endAdornment}
    />
  )
);

CustomInput.displayName = "CustomInput";

export default CustomInput;
