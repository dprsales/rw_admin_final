import React, { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircleOutline,
  ChevronLeft,
  ChevronRight,
  Close,
  DeleteOutline,
  EditOutlined,
  ExpandMore,
  OpenInNew,
  PlayCircleOutline,
  SaveOutlined,
  ZoomIn,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import PageHeader from '../../Components/PageHeader'
import EmptyState from '../../Components/EmptyState'
import ConfirmDialog from '../../Components/ConfirmDialog'
import { PageSkeleton } from '../../Components/LoadingState'
import { tokens } from '../../Theme/tokens'
import {
  approveAdminListing,
  deleteAdminListing,
  getAdminListing,
  rejectAdminListing,
  updateAdminListing,
} from '../../api/services'

type ListingStatus = 'pending' | 'approved' | 'rejected'

interface AdminListing {
  _id: string
  title?: string
  city?: string
  locality?: string
  listingType?: string
  propertyType?: string
  bhk?: string
  status: ListingStatus
  priceValue?: number
  coverImage?: string
  email?: string
  mobile?: string
  ownerName?: string
  slug?: string
  views?: number
  enquiryCount?: number
  commissionAccepted?: boolean
  commissionAcceptedAt?: string
  commissionTermsVersion?: string
  commissionTermsText?: string
  listingConsents?: {
    displayOnWebsite?: boolean
    useDetails?: boolean
    useMedia?: boolean
    runAds?: boolean
  }
  listingConsentsText?: string[]
  listingConsentsAcceptedAt?: string
  listingConsentsVersion?: string
  details?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  approvedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  enquiries?: {
    _id: string
    name: string
    email: string
    phone?: string
    message?: string
    createdAt?: string
  }[]
}

type EditForm = {
  ownerName: string
  email: string
  mobile: string
  city: string
  listingType: string
  locality: string
  bhk: string
  propertyType: string
  buildingType: string
  price: string
  priceType: string
  areaSize: string
  areaType: string
  areaUnit: string
  possessionStatus: string
  propertyAge: string
  bathrooms: string
  coveredParking: string
  openParking: string
  balcony: string
  furnishingStatus: string
  powerBackup: string
  facing: string
  view: string
  floorNumber: string
  totalFloors: string
  transactionType: string
  ownershipType: string
  tower: string
  unitNo: string
  keepPrivate: boolean
  projectName: string
  reraNumber: string
  possessionDate: string
  roadWidth: string
  roadWidthUnit: string
  flooring: string
  oneLineDescription: string
  description: string
  negativeNote: string
  imagesText: string
  videosText: string
  additionalSpaces: string
  propertyHighlights: string
  priceAdvantages: string
  negativeHighlights: string
  amenitiesText: string
  locationAdvantagesText: string
}

const STATUS_COLOR: Record<ListingStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const LISTING_TYPES = ['Sale', 'Rent']
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Builder Floor', 'Penthouse', 'Independent House']
const BHK_OPTIONS = [
  'Studio', '1 RK', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '5 BHK', '6 BHK', '6+ BHK',
]
const CITY_OPTIONS = [
  'Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR', 'Kolkata', 'Ahmedabad', 'Vijayawada', 'Visakhapatnam',
]
const FURNISHING = ['Furnished', 'Semi-Furnished', 'Unfurnished']
const POSSESSION = ['Ready To Move', 'Under Construction']
const POWER = ['No Back-up', 'Partial', 'Full']
const TRANSACTION = ['Resale', 'New Booking']
const OWNERSHIP = ['Free Hold', 'Leasehold', 'Power of attorney']
const AREA_TYPES = ['Carpet Area', 'Built-up Area', 'Super Built-up Area', 'Plot Area']
const AREA_UNITS = ['sq.ft', 'sq.yd', 'sq.m', 'acres']
const PRICE_TYPES = ['All Inclusive', 'Base Price']
const BUILDING_TYPES = ['Residential', 'Commercial']
const ROAD_UNITS = ['Feet', 'Meter']

const formatPrice = (value?: number) => {
  if (!value || value <= 0) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const joinList = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.trim()).join(', ') : ''

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

const urlsToText = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.trim()).join('\n') : ''

const textToUrls = (value: string) =>
  value
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))

const amenitiesToText = (amenities: unknown) => {
  if (!amenities || typeof amenities !== 'object') return ''
  return Object.entries(amenities as Record<string, string[]>)
    .flatMap(([group, list]) => (Array.isArray(list) ? list.map((item) => `${group}: ${item}`) : []))
    .join('\n')
}

const textToAmenities = (value: string) => {
  const out: Record<string, string[]> = {}
  value.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) {
      out.other = [...(out.other || []), line]
      return
    }
    const group = line.slice(0, idx).trim() || 'other'
    const item = line.slice(idx + 1).trim()
    if (!item) return
    out[group] = [...(out[group] || []), item]
  })
  return out
}

const locationAdvantagesToText = (value: unknown) => {
  if (!value || typeof value !== 'object') return ''
  return Object.entries(value as Record<string, string>)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

const textToLocationAdvantages = (value: string) => {
  const out: Record<string, string> = {}
  value.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    const dist = line.slice(idx + 1).trim()
    if (key && dist) out[key] = dist
  })
  return out
}

function toForm(listing: AdminListing): EditForm {
  const d = listing.details || {}
  return {
    ownerName: listing.ownerName || '',
    email: listing.email || '',
    mobile: listing.mobile || '',
    city: listing.city || d.city || '',
    listingType: listing.listingType || d.listingType || 'Sale',
    locality: listing.locality || d.locality || '',
    bhk: listing.bhk || d.bhk || '',
    propertyType: listing.propertyType || (Array.isArray(d.propertyTypes) ? d.propertyTypes[0] : '') || '',
    buildingType: d.buildingType || '',
    price: d.price != null ? String(d.price) : '',
    priceType: d.priceType || '',
    areaSize: d.areaSize != null ? String(d.areaSize) : '',
    areaType: d.areaType || '',
    areaUnit: d.areaUnit || '',
    possessionStatus: d.possessionStatus || '',
    propertyAge: d.propertyAge || '',
    bathrooms: d.bathrooms != null ? String(d.bathrooms) : '',
    coveredParking: d.coveredParking != null ? String(d.coveredParking) : '',
    openParking: d.openParking != null ? String(d.openParking) : '',
    balcony: d.balcony != null ? String(d.balcony) : '',
    furnishingStatus: d.furnishingStatus || '',
    powerBackup: d.powerBackup || '',
    facing: d.facing || '',
    view: d.view || '',
    floorNumber: d.floorNumber != null ? String(d.floorNumber) : '',
    totalFloors: d.totalFloors != null ? String(d.totalFloors) : '',
    transactionType: d.transactionType || '',
    ownershipType: d.ownershipType || '',
    tower: d.tower || '',
    unitNo: d.unitNo || '',
    keepPrivate: Boolean(d.keepPrivate),
    projectName: d.projectName || '',
    reraNumber: d.reraNumber || '',
    possessionDate: d.possessionDate || '',
    roadWidth: d.roadWidth != null ? String(d.roadWidth) : '',
    roadWidthUnit: d.roadWidthUnit || '',
    flooring: d.flooring || '',
    oneLineDescription: d.oneLineDescription || '',
    description: d.description || '',
    negativeNote: d.negativeNote || '',
    imagesText: urlsToText(d.images),
    videosText: urlsToText(d.videos),
    additionalSpaces: joinList(d.additionalSpaces),
    propertyHighlights: joinList(d.propertyHighlights),
    priceAdvantages: joinList(d.priceAdvantages),
    negativeHighlights: joinList(d.negativeHighlights),
    amenitiesText: amenitiesToText(d.amenities),
    locationAdvantagesText: locationAdvantagesToText(d.locationAdvantages),
  }
}

function formToPayload(form: EditForm) {
  const images = textToUrls(form.imagesText)
  const videos = textToUrls(form.videosText)
  return {
    city: form.city.trim(),
    listingType: form.listingType,
    ownerName: form.ownerName.trim(),
    email: form.email.trim().toLowerCase(),
    mobile: form.mobile.trim(),
    details: {
      listingType: form.listingType,
      city: form.city.trim(),
      locality: form.locality.trim(),
      bhk: form.bhk,
      propertyTypes: form.propertyType ? [form.propertyType] : [],
      buildingType: form.buildingType,
      price: form.price,
      priceType: form.priceType,
      areaSize: form.areaSize,
      areaType: form.areaType,
      areaUnit: form.areaUnit,
      possessionStatus: form.possessionStatus,
      propertyAge: form.propertyAge,
      bathrooms: form.bathrooms,
      coveredParking: form.coveredParking,
      openParking: form.openParking,
      balcony: form.balcony,
      furnishingStatus: form.furnishingStatus,
      powerBackup: form.powerBackup,
      facing: form.facing,
      view: form.view,
      floorNumber: form.floorNumber,
      totalFloors: form.totalFloors,
      transactionType: form.transactionType,
      ownershipType: form.ownershipType,
      tower: form.tower.trim(),
      unitNo: form.unitNo.trim(),
      keepPrivate: form.keepPrivate,
      projectName: form.projectName.trim(),
      reraNumber: form.reraNumber.trim(),
      possessionDate: form.possessionDate.trim(),
      roadWidth: form.roadWidth,
      roadWidthUnit: form.roadWidthUnit,
      flooring: form.flooring,
      oneLineDescription: form.oneLineDescription.trim(),
      description: form.description.trim(),
      negativeNote: form.negativeNote.trim(),
      images,
      videos,
      additionalSpaces: splitList(form.additionalSpaces),
      propertyHighlights: splitList(form.propertyHighlights),
      priceAdvantages: splitList(form.priceAdvantages),
      negativeHighlights: splitList(form.negativeHighlights),
      amenities: textToAmenities(form.amenitiesText),
      locationAdvantages: textToLocationAdvantages(form.locationAdvantagesText),
    },
  }
}

function FieldRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const display = value === undefined || value === null || value === '' ? '-' : value
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, letterSpacing: 0.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {display}
      </Typography>
    </Box>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 700, color: tokens.goldText, lineHeight: 1.3, m: 0 }}
    >
      {children}
    </Typography>
  )
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [formError, setFormError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [expanded, setExpanded] = useState<string[]>(['overview', 'owner', 'basic'])
  const [mediaPreview, setMediaPreview] = useState<{ kind: 'image' | 'video'; index: number } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminListing | null>(null)

  const { data: listing, isPending, error, isFetching } = useQuery<AdminListing>({
    queryKey: ['admin-listing', id],
    queryFn: () => getAdminListing(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (listing && !editing) setForm(toForm(listing))
  }, [listing, editing])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-listing', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
  }

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((cur) => (cur ? { ...cur, [key]: value } : cur))
    if (formError) setFormError('')
  }

  const toggleSection = (key: string) => {
    setExpanded((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
  }

  const approveMut = useMutation({
    mutationFn: () => approveAdminListing(id!),
    onSuccess: () => {
      toast.success('Listing approved and live')
      invalidate()
    },
    onError: () => toast.error('Could not approve listing'),
  })

  const rejectMut = useMutation({
    mutationFn: (reason?: string) => rejectAdminListing(id!, reason),
    onSuccess: () => {
      toast.success('Listing rejected')
      setRejectOpen(false)
      setRejectReason('')
      invalidate()
    },
    onError: () => toast.error('Could not reject listing'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminListing(id!),
    onSuccess: () => {
      toast.success('Listing deleted')
      navigate('/listings')
    },
    onError: () => toast.error('Could not delete listing'),
  })

  const saveMut = useMutation({
    mutationFn: (payload: ReturnType<typeof formToPayload>) => updateAdminListing(id!, payload),
    onSuccess: () => {
      toast.success('Listing updated')
      setEditing(false)
      setFormError('')
      invalidate()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Could not save listing')
    },
  })

  const d = listing?.details || {}
  const images = Array.isArray(d.images) ? d.images.filter((u: unknown) => typeof u === 'string') : []
  const videos = Array.isArray(d.videos) ? d.videos.filter((u: unknown) => typeof u === 'string') : []
  const amenityEntries = useMemo(() => {
    if (!d.amenities || typeof d.amenities !== 'object') return [] as [string, string[]][]
    return Object.entries(d.amenities as Record<string, string[]>).filter(([, list]) => Array.isArray(list) && list.length)
  }, [d.amenities])

  const locationEntries = useMemo(() => {
    if (!d.locationAdvantages || typeof d.locationAdvantages !== 'object') return [] as [string, string][]
    return Object.entries(d.locationAdvantages as Record<string, string>).filter(([, v]) => typeof v === 'string' && v.trim())
  }, [d.locationAdvantages])

  if (isPending) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageSkeleton />
      </Box>
    )
  }

  if (error || !listing) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <PageHeader
          title="Listing detail"
          crumbs={[{ label: 'Listings', to: '/listings' }, { label: 'Listing detail' }]}
        />
        <Paper sx={{ borderRadius: 3 }}>
          <EmptyState
            title="Listing not found"
            description="Unable to load this listing. It may have been deleted."
            actionLabel="Back to listings"
            onAction={() => navigate('/listings')}
          />
        </Paper>
      </Box>
    )
  }

  const onStartEdit = () => {
    setForm(toForm(listing))
    setFormError('')
    setEditing(true)
    setExpanded(['overview', 'owner', 'basic', 'config', 'location', 'highlights', 'media', 'description'])
  }

  const onCancelEdit = () => {
    setForm(toForm(listing))
    setFormError('')
    setEditing(false)
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (!form.city.trim()) {
      setFormError('City is required.')
      setExpanded((cur) => (cur.includes('basic') ? cur : [...cur, 'basic']))
      return
    }
    if (!form.email.trim()) {
      setFormError('Owner email is required.')
      setExpanded((cur) => (cur.includes('owner') ? cur : [...cur, 'owner']))
      return
    }
    const images = textToUrls(form.imagesText)
    if (!images.length) {
      setFormError('Keep at least one photo URL.')
      setExpanded((cur) => (cur.includes('media') ? cur : [...cur, 'media']))
      return
    }
    saveMut.mutate(formToPayload(form))
  }

  const accordionSx = {
    borderRadius: '12px !important',
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
    mb: 1.5,
    '&:before': { display: 'none' },
    overflow: 'hidden',
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, pb: 6 }} component="form" onSubmit={onSave}>
      <PageHeader
        title={d.oneLineDescription || listing.title || 'Listing detail'}
        description={listing.title}
        crumbs={[{ label: 'Listings', to: '/listings' }, { label: 'Listing detail' }]}
        actions={
          <>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/listings')} sx={{ minHeight: 44 }}>
              Back to listings
            </Button>
            {!editing ? (
              <Button variant="contained" startIcon={<EditOutlined />} onClick={onStartEdit} sx={{ minHeight: 44 }}>
                Edit listing
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={onCancelEdit} disabled={saveMut.isPending} sx={{ minHeight: 44 }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saveMut.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                  disabled={saveMut.isPending}
                  sx={{ minHeight: 44 }}
                >
                  Save changes
                </Button>
              </>
            )}
            {listing.status !== 'approved' && (
              <Button
                color="success"
                variant="contained"
                startIcon={<CheckCircleOutline />}
                disabled={editing || approveMut.isPending}
                onClick={() => approveMut.mutate()}
                sx={{ minHeight: 44 }}
              >
                Approve
              </Button>
            )}
            {listing.status !== 'rejected' && (
              <Button
                color="warning"
                variant="outlined"
                disabled={editing}
                onClick={() => { setRejectReason(''); setRejectOpen(true) }}
                sx={{ minHeight: 44 }}
              >
                Reject
              </Button>
            )}
            <IconButton
              color="error"
              aria-label="Delete listing"
              disabled={editing || deleteMut.isPending}
              onClick={() => setPendingDelete(listing)}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <DeleteOutline />
            </IconButton>
          </>
        }
      />
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip size="small" label={listing.status} color={STATUS_COLOR[listing.status]} sx={{ textTransform: 'capitalize' }} />
        <Chip size="small" variant="outlined" label={listing.listingType || '-'} />
        {listing.bhk && <Chip size="small" variant="outlined" label={listing.bhk} />}
        <Chip size="small" variant="outlined" label={formatPrice(listing.priceValue)} />
        {isFetching && <Chip size="small" label="Refreshing" />}
      </Stack>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {formError}
        </Alert>
      )}

      {listing.coverImage && (
        <Paper
          sx={{
            mb: 2,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: tokens.panelAlt,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => {
              const coverIndex = Math.max(0, images.findIndex((url: string) => url === listing.coverImage))
              setMediaPreview({ kind: 'image', index: coverIndex >= 0 ? coverIndex : 0 })
            }}
            aria-label="Preview cover photo"
            sx={{
              display: 'block',
              width: '100%',
              p: 0,
              border: 0,
              bgcolor: 'transparent',
              cursor: images.length ? 'pointer' : 'default',
              '&:focus-visible': { outline: `2px solid ${tokens.gold}`, outlineOffset: -2 },
            }}
          >
            <Box
              component="img"
              src={listing.coverImage}
              alt={listing.title || 'Listing cover'}
              sx={{
                width: '100%',
                maxHeight: { xs: 280, sm: 420 },
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                bgcolor: tokens.panelAlt,
              }}
            />
          </Box>
          {images.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, py: 1 }}>
              Cover photo · click to preview full size
            </Typography>
          )}
        </Paper>
      )}

      <Accordion expanded={expanded.includes('overview')} onChange={() => toggleSection('overview')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Overview</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Status" value={listing.status} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Views" value={listing.views ?? 0} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Enquiries" value={listing.enquiryCount ?? listing.enquiries?.length ?? 0} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Created" value={formatDate(listing.createdAt)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Updated" value={formatDate(listing.updatedAt)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Approved" value={formatDate(listing.approvedAt)} /></Grid>
            <Grid item xs={12} sm={6} md={4}><FieldRow label="Reviewed" value={formatDate(listing.reviewedAt)} /></Grid>
            {listing.rejectionReason && (
              <Grid item xs={12}><FieldRow label="Rejection reason" value={listing.rejectionReason} /></Grid>
            )}
            <Grid item xs={12}>
              {listing.slug ? (
                <Link
                  href={`https://www.rajivwilliams.com/realty/listings/${listing.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minHeight: 44 }}
                >
                  Open public page <OpenInNew sx={{ fontSize: 16 }} />
                </Link>
              ) : (
                <FieldRow label="Public page" value="Not published yet" />
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('owner')} onChange={() => toggleSection('owner')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Owner and contact</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner name"
                  value={form.ownerName}
                  onChange={(e) => setField('ownerName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={form.mobile}
                  onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  helperText="10 digit mobile"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><FieldRow label="Owner name" value={listing.ownerName} /></Grid>
              <Grid item xs={12} sm={4}><FieldRow label="Email" value={listing.email} /></Grid>
              <Grid item xs={12} sm={4}><FieldRow label="Mobile" value={listing.mobile} /></Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('basic')} onChange={() => toggleSection('basic')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Basic details</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="listing-city-label">City</InputLabel>
                  <Select
                    labelId="listing-city-label"
                    label="City"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                  >
                    {CITY_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    {form.city && !CITY_OPTIONS.includes(form.city) && (
                      <MenuItem value={form.city}>{form.city}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="listing-type-label">Listing type</InputLabel>
                  <Select
                    labelId="listing-type-label"
                    label="Listing type"
                    value={form.listingType}
                    onChange={(e) => setField('listingType', e.target.value)}
                  >
                    {LISTING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Locality" value={form.locality} onChange={(e) => setField('locality', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="property-type-label">Property type</InputLabel>
                  <Select
                    labelId="property-type-label"
                    label="Property type"
                    value={form.propertyType}
                    onChange={(e) => setField('propertyType', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {PROPERTY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="building-type-label">Building type</InputLabel>
                  <Select
                    labelId="building-type-label"
                    label="Building type"
                    value={form.buildingType}
                    onChange={(e) => setField('buildingType', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {BUILDING_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="bhk-label">BHK</InputLabel>
                  <Select labelId="bhk-label" label="BHK" value={form.bhk} onChange={(e) => setField('bhk', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {BHK_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Price" value={form.price} onChange={(e) => setField('price', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="price-type-label">Price type</InputLabel>
                  <Select
                    labelId="price-type-label"
                    label="Price type"
                    value={form.priceType}
                    onChange={(e) => setField('priceType', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {PRICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Area size" value={form.areaSize} onChange={(e) => setField('areaSize', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="area-type-label">Area type</InputLabel>
                  <Select
                    labelId="area-type-label"
                    label="Area type"
                    value={form.areaType}
                    onChange={(e) => setField('areaType', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {AREA_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="area-unit-label">Area unit</InputLabel>
                  <Select
                    labelId="area-unit-label"
                    label="Area unit"
                    value={form.areaUnit}
                    onChange={(e) => setField('areaUnit', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {AREA_UNITS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Project name" value={form.projectName} onChange={(e) => setField('projectName', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="RERA number" value={form.reraNumber} onChange={(e) => setField('reraNumber', e.target.value)} />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="City" value={listing.city} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Listing type" value={listing.listingType} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Locality" value={listing.locality || d.locality} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Property type" value={listing.propertyType || (Array.isArray(d.propertyTypes) ? d.propertyTypes.join(', ') : '')} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Building type" value={d.buildingType} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="BHK" value={listing.bhk || d.bhk} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Price" value={d.price ? String(d.price) : formatPrice(listing.priceValue)} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Price type" value={d.priceType} /></Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FieldRow
                  label="Area"
                  value={[d.areaSize, d.areaUnit, d.areaType].filter(Boolean).join(' ') || '-'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Project name" value={d.projectName} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="RERA number" value={d.reraNumber} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Additional spaces" value={joinList(d.additionalSpaces)} /></Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('config')} onChange={() => toggleSection('config')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Configuration</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="possession-label">Possession</InputLabel>
                  <Select labelId="possession-label" label="Possession" value={form.possessionStatus} onChange={(e) => setField('possessionStatus', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {POSSESSION.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Property age" value={form.propertyAge} onChange={(e) => setField('propertyAge', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Possession date" value={form.possessionDate} onChange={(e) => setField('possessionDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Bathrooms" value={form.bathrooms} onChange={(e) => setField('bathrooms', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Covered parking" value={form.coveredParking} onChange={(e) => setField('coveredParking', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Open parking" value={form.openParking} onChange={(e) => setField('openParking', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Balcony" value={form.balcony} onChange={(e) => setField('balcony', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="furnish-label">Furnishing</InputLabel>
                  <Select labelId="furnish-label" label="Furnishing" value={form.furnishingStatus} onChange={(e) => setField('furnishingStatus', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {FURNISHING.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="power-label">Power backup</InputLabel>
                  <Select labelId="power-label" label="Power backup" value={form.powerBackup} onChange={(e) => setField('powerBackup', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {POWER.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="txn-label">Transaction</InputLabel>
                  <Select labelId="txn-label" label="Transaction" value={form.transactionType} onChange={(e) => setField('transactionType', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {TRANSACTION.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="own-label">Ownership</InputLabel>
                  <Select labelId="own-label" label="Ownership" value={form.ownershipType} onChange={(e) => setField('ownershipType', e.target.value)}>
                    <MenuItem value="">-</MenuItem>
                    {OWNERSHIP.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Flooring" value={form.flooring} onChange={(e) => setField('flooring', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Additional spaces"
                  value={form.additionalSpaces}
                  onChange={(e) => setField('additionalSpaces', e.target.value)}
                  helperText="Comma separated"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Possession" value={d.possessionStatus} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Property age" value={d.propertyAge} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Possession date" value={d.possessionDate} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Bathrooms" value={d.bathrooms} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Covered parking" value={d.coveredParking} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Open parking" value={d.openParking} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Balcony" value={d.balcony} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Furnishing" value={d.furnishingStatus} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Power backup" value={d.powerBackup} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Transaction" value={d.transactionType} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Ownership" value={d.ownershipType} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Flooring" value={d.flooring} /></Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('location')} onChange={() => toggleSection('location')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Location and unit</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Tower" value={form.tower} onChange={(e) => setField('tower', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Unit no" value={form.unitNo} onChange={(e) => setField('unitNo', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={<Switch checked={form.keepPrivate} onChange={(e) => setField('keepPrivate', e.target.checked)} />}
                  label="Keep tower / unit private on public page"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Facing" value={form.facing} onChange={(e) => setField('facing', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="View" value={form.view} onChange={(e) => setField('view', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Floor number" value={form.floorNumber} onChange={(e) => setField('floorNumber', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Total floors" value={form.totalFloors} onChange={(e) => setField('totalFloors', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Road width" value={form.roadWidth} onChange={(e) => setField('roadWidth', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="road-unit-label">Road width unit</InputLabel>
                  <Select
                    labelId="road-unit-label"
                    label="Road width unit"
                    value={form.roadWidthUnit}
                    onChange={(e) => setField('roadWidthUnit', e.target.value)}
                  >
                    <MenuItem value="">-</MenuItem>
                    {ROAD_UNITS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Nearby advantages"
                  value={form.locationAdvantagesText}
                  onChange={(e) => setField('locationAdvantagesText', e.target.value)}
                  helperText="One per line as key: distance (example: schools: 1-3 km)"
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Tower" value={d.tower} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Unit no" value={d.unitNo} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Keep private" value={d.keepPrivate ? 'Yes' : 'No'} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Facing" value={d.facing} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="View" value={d.view} /></Grid>
              <Grid item xs={12} sm={6} md={4}><FieldRow label="Floor" value={[d.floorNumber, d.totalFloors ? `of ${d.totalFloors}` : ''].filter(Boolean).join(' ')} /></Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FieldRow label="Road width" value={[d.roadWidth, d.roadWidthUnit].filter(Boolean).join(' ')} />
              </Grid>
              <Grid item xs={12}>
                <FieldRow
                  label="Nearby"
                  value={locationEntries.length ? locationEntries.map(([k, v]) => `${k}: ${v}`).join('\n') : '-'}
                />
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('highlights')} onChange={() => toggleSection('highlights')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Highlights and amenities</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Property highlights"
                  value={form.propertyHighlights}
                  onChange={(e) => setField('propertyHighlights', e.target.value)}
                  helperText="Comma separated"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price advantages"
                  value={form.priceAdvantages}
                  onChange={(e) => setField('priceAdvantages', e.target.value)}
                  helperText="Comma separated"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Honest disclosures"
                  value={form.negativeHighlights}
                  onChange={(e) => setField('negativeHighlights', e.target.value)}
                  helperText="Comma separated"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Disclosure note"
                  value={form.negativeNote}
                  onChange={(e) => setField('negativeNote', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Amenities"
                  value={form.amenitiesText}
                  onChange={(e) => setField('amenitiesText', e.target.value)}
                  helperText="One per line as group: item (example: sports: Gym)"
                />
              </Grid>
            </Grid>
          ) : (
            <Stack spacing={2}>
              <FieldRow label="Property highlights" value={joinList(d.propertyHighlights)} />
              <FieldRow label="Price advantages" value={joinList(d.priceAdvantages)} />
              <FieldRow label="Honest disclosures" value={joinList(d.negativeHighlights)} />
              <FieldRow label="Disclosure note" value={d.negativeNote} />
              <Box>
                <Typography variant="caption" color="text.secondary">Amenities</Typography>
                {amenityEntries.length === 0 ? (
                  <Typography variant="body2">-</Typography>
                ) : (
                  amenityEntries.map(([group, list]) => (
                    <Box key={group} sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{group}</Typography>
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {list.map((item) => <Chip key={`${group}-${item}`} size="small" label={item} variant="outlined" />)}
                      </Stack>
                    </Box>
                  ))
                )}
              </Box>
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('media')} onChange={() => toggleSection('media')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Media</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  label="Photo URLs"
                  value={form.imagesText}
                  onChange={(e) => setField('imagesText', e.target.value)}
                  helperText="One https URL per line. First image becomes the cover."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Video URLs"
                  value={form.videosText}
                  onChange={(e) => setField('videosText', e.target.value)}
                  helperText="One https URL per line"
                />
              </Grid>
            </Grid>
          ) : (
            <Stack spacing={2}>
              <Typography variant="caption" color="text.secondary">
                Photos ({images.length}) · click a photo to preview
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {images.length === 0 && <Typography variant="body2">-</Typography>}
                {images.map((url: string, index: number) => (
                  <Box
                    key={url}
                    component="button"
                    type="button"
                    onClick={() => setMediaPreview({ kind: 'image', index })}
                    aria-label={`Preview photo ${index + 1}`}
                    sx={{
                      position: 'relative',
                      p: 0,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      bgcolor: tokens.panelAlt,
                      width: 140,
                      height: 105,
                      '&:hover .media-preview-hint, &:focus-visible .media-preview-hint': { opacity: 1 },
                      '&:focus-visible': { outline: `2px solid ${tokens.gold}`, outlineOffset: 2 },
                    }}
                  >
                    <Box
                      component="img"
                      src={url}
                      alt={`Listing photo ${index + 1}`}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <Box
                      className="media-preview-hint"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: tokens.gold,
                        color: tokens.black,
                        opacity: 0,
                        transition: 'opacity 160ms ease',
                      }}
                    >
                      <ZoomIn aria-hidden="true" />
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Videos ({videos.length}) · preview below or open full size
              </Typography>
              {videos.length === 0 ? (
                <Typography variant="body2">-</Typography>
              ) : (
                <Stack spacing={2}>
                  {videos.map((url: string, index: number) => (
                    <Paper key={url} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box
                        component="video"
                        src={url}
                        controls
                        preload="metadata"
                        sx={{
                          width: '100%',
                          maxHeight: 360,
                          borderRadius: 1.5,
                          bgcolor: tokens.black,
                          display: 'block',
                        }}
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }} alignItems="center">
                        <Button
                          size="small"
                          startIcon={<PlayCircleOutline />}
                          onClick={() => setMediaPreview({ kind: 'video', index })}
                          sx={{ minHeight: 40 }}
                        >
                          Full preview
                        </Button>
                        <Link href={url} target="_blank" rel="noreferrer" underline="hover" sx={{ fontSize: 13, wordBreak: 'break-all' }}>
                          Open file <OpenInNew sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                        </Link>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('description')} onChange={() => toggleSection('description')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Description</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {editing && form ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="One-line description"
                  value={form.oneLineDescription}
                  onChange={(e) => setField('oneLineDescription', e.target.value)}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  label="Full description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </Grid>
            </Grid>
          ) : (
            <Stack spacing={1.5}>
              <FieldRow label="One-line" value={d.oneLineDescription} />
              <FieldRow label="Description" value={d.description} />
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('consents')} onChange={() => toggleSection('consents')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Publish permissions and commission</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <FieldRow
              label="Commission consent"
              value={listing.commissionAccepted ? `Accepted ${formatDate(listing.commissionAcceptedAt)}` : 'Not recorded'}
            />
            <FieldRow label="Commission terms version" value={listing.commissionTermsVersion} />
            <FieldRow label="Commission terms" value={listing.commissionTermsText} />
            <FieldRow
              label="Listing permissions accepted"
              value={listing.listingConsentsAcceptedAt ? formatDate(listing.listingConsentsAcceptedAt) : 'Not recorded'}
            />
            <FieldRow label="Permissions version" value={listing.listingConsentsVersion} />
            {Array.isArray(listing.listingConsentsText) && listing.listingConsentsText.length > 0 ? (
              listing.listingConsentsText.map((line) => (
                <Typography key={line} variant="body2">{line}</Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No permission lines recorded.</Typography>
            )}
            {listing.listingConsents && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
                {Object.entries(listing.listingConsents).map(([key, value]) => (
                  <Chip
                    key={key}
                    size="small"
                    label={`${key}: ${value ? 'yes' : 'no'}`}
                    color={value ? 'success' : 'default'}
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded.includes('enquiries')} onChange={() => toggleSection('enquiries')} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SectionTitle>Enquiries ({listing.enquiries?.length || 0})</SectionTitle>
        </AccordionSummary>
        <AccordionDetails>
          {!listing.enquiries?.length ? (
            <Typography variant="body2" color="text.secondary">No enquiries yet. Desk-only, not sent to the lister.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {listing.enquiries.map((e) => (
                <Paper key={e._id} variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {e.name} · {e.email}{e.phone ? ` · ${e.phone}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(e.createdAt)} · desk only
                  </Typography>
                  {e.message && <Typography variant="body2" sx={{ mt: 0.75 }}>{e.message}</Typography>}
                </Paper>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      {editing && (
        <Paper
          elevation={0}
          sx={{
            position: 'sticky',
            bottom: 12,
            mt: 2,
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            zIndex: 2,
          }}
        >
          <Button variant="outlined" onClick={onCancelEdit} disabled={saveMut.isPending} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saveMut.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            disabled={saveMut.isPending}
            sx={{ minHeight: 44 }}
          >
            Save changes
          </Button>
        </Paper>
      )}

      <Dialog
        open={!!mediaPreview}
        onClose={() => setMediaPreview(null)}
        maxWidth="lg"
        fullWidth
        aria-label="Media preview"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pr: 1 }}>
          <Typography variant="h6" component="span">
            {mediaPreview?.kind === 'video'
              ? `Video ${(mediaPreview?.index ?? 0) + 1} of ${videos.length}`
              : `Photo ${(mediaPreview?.index ?? 0) + 1} of ${images.length}`}
          </Typography>
          <IconButton aria-label="Close preview" onClick={() => setMediaPreview(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: tokens.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
          {mediaPreview?.kind === 'image' && images[mediaPreview.index] && (
            <Box
              component="img"
              src={images[mediaPreview.index]}
              alt={`Listing photo ${(mediaPreview.index ?? 0) + 1}`}
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
            />
          )}
          {mediaPreview?.kind === 'video' && videos[mediaPreview.index] && (
            <Box
              component="video"
              src={videos[mediaPreview.index]}
              controls
              autoPlay
              sx={{ width: '100%', maxHeight: '70vh', borderRadius: 1, bgcolor: tokens.black }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
          <Button
            startIcon={<ChevronLeft />}
            disabled={
              !mediaPreview
              || mediaPreview.index <= 0
            }
            onClick={() =>
              setMediaPreview((cur) => (cur ? { ...cur, index: Math.max(0, cur.index - 1) } : cur))
            }
          >
            Previous
          </Button>
          <Button
            endIcon={<ChevronRight />}
            disabled={
              !mediaPreview
              || mediaPreview.index >= (mediaPreview.kind === 'image' ? images.length : videos.length) - 1
            }
            onClick={() =>
              setMediaPreview((cur) => {
                if (!cur) return cur
                const max = cur.kind === 'image' ? images.length - 1 : videos.length - 1
                return { ...cur, index: Math.min(max, cur.index + 1) }
              })
            }
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject listing</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason (emailed to the owner)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            disabled={rejectMut.isPending}
            onClick={() => rejectMut.mutate(rejectReason.trim() || undefined)}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete listing?"
        description="Delete this listing and its photos/videos from CDN permanently?"
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMut.isPending}
        onConfirm={() => {
          setPendingDelete(null)
          deleteMut.mutate()
        }}
        onClose={() => setPendingDelete(null)}
      />
    </Box>
  )
}
