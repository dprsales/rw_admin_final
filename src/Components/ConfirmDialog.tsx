import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { tokens } from '../Theme/tokens';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * One confirmation dialog for destructive and high-impact actions.
 * Primary actions stay gold; danger actions use the deep red.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}) => {
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      PaperProps={{
        sx: {
          backgroundColor: tokens.panel,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadowStrong,
        },
      }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        {description ? (
          <Typography id={descriptionId} sx={{ fontSize: 13, color: tokens.textMuted, lineHeight: 1.55 }}>
            {description}
          </Typography>
        ) : null}
        {children}
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
          disabled={loading}
          sx={{ color: tokens.textMuted, '&:hover': { backgroundColor: tokens.hover, color: tokens.text } }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={tone === 'danger' ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={loading || confirmDisabled}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
