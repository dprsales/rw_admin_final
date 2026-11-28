import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  importStaffLeads,
  type StaffLeadImportRow,
} from '../../api/services';
import { tokens } from '../../Theme/tokens';

type ImportLeadsDialogProps = {
  open: boolean;
  onClose: () => void;
};

type PreviewRow = StaffLeadImportRow & {
  line: number;
  status: 'ready' | 'bad';
  reason?: string;
  ownerLabel?: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      if (ch === '\r' && next === '\n') i += 1;
      continue;
    }
    if (ch === '\r') {
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  return rows;
}

function normHeader(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function digitsPhone(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function mapCrmSource(raw: string): string {
  const s = String(raw || '').toLowerCase();
  if (/facebook|instagram|meta|fb\b/.test(s)) return 'meta';
  if (/google/.test(s)) return 'google';
  if (/whatsapp/.test(s)) return 'whatsapp';
  if (/website|web/.test(s)) return 'website';
  if (/referral|refer/.test(s)) return 'referral';
  if (/partner|channel/.test(s)) return 'channel_partner';
  if (/walk/.test(s)) return 'walk_in';
  if (/housing/.test(s)) return 'housing';
  if (!s || s === '-') return 'manual';
  return 'other';
}

function parsePrivyrDate(raw: string): string | undefined {
  const s = String(raw || '').trim();
  if (!s || s === '-') return undefined;
  // 2026-11-28 - 07:24
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})\s*[-–]?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (m) {
    const iso = `${m[1]}-${m[2]}-${m[3]}T${String(m[4]).padStart(2, '0')}:${m[5]}:${m[6] || '00'}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) return d2.toISOString();
  return undefined;
}

function isDeadFlag(raw: string): boolean {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s || s === '-' || s === 'no' || s === 'false' || s === '0') return false;
  return /^(yes|true|1|dead|y)$/.test(s) || s.includes('dead');
}

function ownerEmailFromCell(raw: string): { email?: string; label: string } {
  const s = String(raw || '').trim();
  if (!s || s === '-') return { label: '' };
  const m = s.match(/\(([^\s@]+@[^\s)]+)\)/);
  if (m) return { email: m[1].toLowerCase(), label: s };
  if (s.includes('@')) return { email: s.toLowerCase(), label: s };
  return { label: s };
}

function guessProjectName(campaign: string, notes: string): string | undefined {
  const blob = `${campaign}\n${notes}`;
  const m = blob.match(
    /(?:campaign|project)\s*[:\-]\s*([^\n@]{3,80})/i,
  );
  if (m?.[1]) return m[1].trim().slice(0, 120);
  if (campaign && campaign !== '-') return campaign.trim().slice(0, 120);
  return undefined;
}

function mapPrivyrRows(matrix: string[][]): PreviewRow[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map(normHeader);
  const idx = (aliases: string[]) => {
    for (const alias of aliases) {
      const i = headers.indexOf(alias);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iName = idx(['clientname', 'name', 'displayname']);
  const iPhone = idx(['phonenumber', 'phone', 'whatsappnumber', 'mobile']);
  const iEmail = idx(['email']);
  const iNotes = idx(['notes', 'note', 'message']);
  const iOwner = idx(['assignedteammember', 'owner', 'assignedto']);
  const iSource = idx(['source']);
  const iCampaign = idx(['facebookcampaign', 'campaign']);
  const iDate = idx(['datecreated', 'createdat', 'date']);
  const iRef = idx(['clientreferenceid', 'metaleadid', 'referenceid']);
  const iDead = idx(['dead', 'status']);
  const iBudget = idx(['budget']);

  const out: PreviewRow[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const get = (i: number) => (i >= 0 ? String(cells[i] ?? '').trim() : '');
    const name = get(iName) || get(idx(['displayname']));
    const phone = digitsPhone(get(iPhone) || get(idx(['whatsappnumber'])));
    const email = get(iEmail);
    const notes = get(iNotes);
    const campaign = get(iCampaign);
    const source = get(iSource);
    const ownerCell = ownerEmailFromCell(get(iOwner));
    const dead = isDeadFlag(get(iDead));
    const budget = get(iBudget);
    const messageParts = [
      notes,
      budget && budget !== '-' ? `Budget: ${budget}` : '',
      campaign && campaign !== '-' ? `Campaign: ${campaign}` : '',
    ].filter(Boolean);
    const projectName = guessProjectName(campaign, notes);
    const createdAt = parsePrivyrDate(get(iDate));
    const importRef = get(iRef);

    const row: PreviewRow = {
      line: r + 1,
      name: name === '-' ? '' : name,
      phoneNumber: phone,
      ...(email && email.includes('@') ? { email: email.toLowerCase() } : {}),
      ...(messageParts.length ? { message: messageParts.join('\n').slice(0, 4000) } : {}),
      ...(projectName ? { projectName } : {}),
      pageSource: (campaign && campaign !== '-' ? campaign : source || 'Privyr import').slice(
        0,
        120,
      ),
      crmSource: mapCrmSource(source || campaign),
      stage: dead ? 'lost' : 'new_lead',
      temperature: 'cold',
      ...(ownerCell.email ? { ownerEmail: ownerCell.email } : {}),
      ownerLabel: ownerCell.label,
      ...(importRef && importRef !== '-' ? { importRef: importRef.slice(0, 120) } : {}),
      ...(createdAt ? { createdAt } : {}),
      status: 'ready',
    };

    if (!row.name || row.phoneNumber.length !== 10) {
      row.status = 'bad';
      row.reason = !row.name ? 'Missing name' : 'Phone needs 10 digits';
    }
    out.push(row);
  }
  return out;
}

const ImportLeadsDialog: React.FC<ImportLeadsDialogProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');

  const readyRows = useMemo(
    () => preview.filter((row) => row.status === 'ready'),
    [preview],
  );
  const badCount = preview.length - readyRows.length;

  const importMutation = useMutation({
    mutationFn: (rows: StaffLeadImportRow[]) => importStaffLeads(rows),
    onSuccess: (result) => {
      toast.success(
        `Imported ${result.created}. Skipped duplicates ${result.skippedDuplicate}. Invalid ${result.skippedInvalid}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setPreview([]);
      setFileName('');
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(' ')
          : message || 'Import failed. Check you are signed in as admin.',
      );
    },
  });

  const onPickFile = async (file?: File | null) => {
    setParseError('');
    setPreview([]);
    setFileName('');
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const matrix = parseCsv(text);
      if (matrix.length < 2) {
        setParseError('CSV looks empty. Export again from Privyr and try once more.');
        return;
      }
      const mapped = mapPrivyrRows(matrix);
      if (!mapped.length) {
        setParseError(
          'Could not read Privyr columns. Need Client Name and Phone Number headers.',
        );
        return;
      }
      setPreview(mapped);
    } catch {
      setParseError('Could not read that file.');
    }
  };

  const handleClose = () => {
    if (importMutation.isPending) return;
    setPreview([]);
    setFileName('');
    setParseError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Import leads from Privyr CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Typography variant="body2" sx={{ color: tokens.textMuted }}>
            Use the Privyr client list export. We map name, phone, email, notes, campaign,
            assigned member email, and dead flag. Matching phones already in the desk are skipped.
          </Typography>

          <Button
            variant="outlined"
            component="label"
            sx={{ textTransform: 'none', alignSelf: 'flex-start', fontWeight: 600 }}
          >
            Choose CSV file
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                void onPickFile(e.target.files?.[0] || null);
                e.target.value = '';
              }}
            />
          </Button>

          {fileName ? (
            <Typography variant="caption" sx={{ color: tokens.textMuted }}>
              File: {fileName} · {preview.length} row{preview.length === 1 ? '' : 's'} ·{' '}
              {readyRows.length} ready
              {badCount ? ` · ${badCount} need fix` : ''}
            </Typography>
          ) : null}

          {parseError ? <Alert severity="warning">{parseError}</Alert> : null}

          {preview.length > 0 ? (
            <TableContainer
              sx={{
                maxHeight: 360,
                border: `1px solid ${tokens.border}`,
                borderRadius: 1.5,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Line</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.slice(0, 80).map((row) => (
                    <TableRow key={`${row.line}-${row.phoneNumber}`}>
                      <TableCell>{row.line}</TableCell>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell>{row.phoneNumber || '-'}</TableCell>
                      <TableCell>
                        {row.ownerEmail || row.ownerLabel || 'Unassigned'}
                      </TableCell>
                      <TableCell>{row.crmSource}</TableCell>
                      <TableCell>
                        {row.status === 'ready' ? (
                          <Box component="span" sx={{ color: tokens.successText }}>
                            Ready{row.stage === 'lost' ? ' · lost' : ''}
                          </Box>
                        ) : (
                          <Box component="span" sx={{ color: tokens.dangerText }}>
                            {row.reason || 'Bad'}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!readyRows.length || importMutation.isPending}
          onClick={() => {
            const payload: StaffLeadImportRow[] = readyRows.map(
              ({ line: _line, status: _status, reason: _reason, ownerLabel: _ol, ...row }) =>
                row,
            );
            importMutation.mutate(payload);
          }}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {importMutation.isPending
            ? 'Importing…'
            : `Import ${readyRows.length || ''} ready`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportLeadsDialog;
