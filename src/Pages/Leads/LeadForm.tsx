// import React, { FC, useEffect } from 'react';
// import {
//   Drawer,
//   Box,
//   Typography,
//   Button,
//   IconButton,
//   FormControl,
//   InputLabel,
//   FormHelperText,
//   Checkbox,
//   FormControlLabel,
// } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import { Controller, useForm } from 'react-hook-form';
// import * as yup from 'yup';
// import { yupResolver } from '@hookform/resolvers/yup';
// import CustomInput from '../../Components/Inputs/CustomInput';
// import { useMutation, useQueryClient } from 'react-query';
// import { addLead, updateLead } from '../../api/services';
// import { toast } from 'react-toastify';


// interface LeadFormProps {
//   open: boolean;
//   onClose: () => void;
//   initialValues?: FormValues;
//   leadId?: string;
// }

// interface FormValues {
//     source: string;
//     channelpartnerId?: string;  // Optional field
//     type: string;
//     name: string;
//     email: string;
//     phoneNumber: string;
//     iAgree?: boolean;  // Optional boolean
//     homeLoan: boolean;
//   }


// const schema = yup.object().shape({
//   source: yup.string().required('Source is required'),
//   channelpartnerId: yup.string().optional(),
//   type: yup.string().required('Type is required'),
//   name: yup.string().required('Name is required'),
//   email: yup.string().email('Invalid email').required('Email is required'),
//   phoneNumber: yup
//     .string()
//     .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits')
//     .required('Phone number is required'),
//   iAgree: yup.boolean().optional(),  
//   homeLoan: yup.boolean().required('Home loan status is required'),
// });

// const LeadForm: FC<LeadFormProps> = ({ open, onClose, initialValues, leadId }) => {
//   const queryClient = useQueryClient();
//   const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
//     resolver: yupResolver(schema),
//     defaultValues: initialValues || {
//       source: '',
//       channelpartnerId: '',
//       type: '',
//       name: '',
//       email: '',
//       phoneNumber: '',
//       iAgree: false,
//       homeLoan: false,
//     },

//   });

//   useEffect(() => {
//     if (initialValues) {
//       reset(initialValues);
//     }
//   }, [initialValues, reset]);

//   const addMutation = useMutation((data: FormValues) => addLead(data), {
//     onSuccess: () => {
//       toast.success('Lead added successfully!');
//       queryClient.invalidateQueries('getLeads');
//       onClose();
//     },
//     onError: (error: any) => {
//       toast.error(`${error.response.data.message}`);
//     },
//   });

//   const updateMutation = useMutation((data: FormValues) => {
//     if (leadId) {
//       return updateLead(leadId, data);
//     }
//     return Promise.reject(new Error('Lead ID is undefined'));
//   }, {
//     onSuccess: () => {
//       toast.success('Lead updated successfully!');
//       queryClient.invalidateQueries('getLeads');
//       onClose();
//     },
//     onError: (error: any) => {
//       toast.error(`${error.response.data.message}`);
//     },
//   });

//   const onSubmit = (data: FormValues) => {
//     if (leadId) {
//       updateMutation.mutate(data);
//     } else {
//       addMutation.mutate(data);
//     }
//   };

//   return (
//     <Drawer
//       anchor="right"
//       open={open}
//       onClose={onClose}
//       PaperProps={{
//         sx: {
//           width: '100%',
//           maxWidth: '360px',
//           background: '#FFFFFF',
//           borderRadius: '0px',
//           border: 'none',
//         },
//       }}
//     >
//       <Box
//         sx={{
//           width: '100%',
//           height: '60px',
//           backgroundColor: 'primary.main',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           color: 'white',
//           padding: '0 16px',
//         }}
//       >
//         <Typography variant="h6" sx={{ color: 'white', fontWeight: '600' }}>
//           {initialValues ? 'Edit Lead' : 'Add Lead'}
//         </Typography>
//         <IconButton onClick={onClose} sx={{ color: 'white', mr: 2 }}>
//           <CloseIcon />
//         </IconButton>
//       </Box>
//       <Box sx={{ padding: '20px' }}>
//         <form onSubmit={handleSubmit(onSubmit)}>
//           <FormControl fullWidth sx={{ marginBottom: 2 }}>
//             <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="source-input">Source</InputLabel>
//             <Controller
//               name="source"
//               control={control}
//               render={({ field }) => (
//                 <CustomInput
//                   id="source-input"
//                   placeholder="Enter source..."
//                   {...field}
//                   error={!!errors.source}
//                 />
//               )}
//             />
//             <FormHelperText error>{errors.source && errors.source.message}</FormHelperText>
//           </FormControl>

//           <FormControl fullWidth sx={{ marginBottom: 2 }}>
//             <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="type-input">Type</InputLabel>
//             <Controller
//               name="type"
//               control={control}
//               render={({ field }) => (
//                 <CustomInput
//                   id="type-input"
//                   placeholder="Enter type..."
//                   {...field}
//                   error={!!errors.type}
//                 />
//               )}
//             />
//             <FormHelperText error>{errors.type && errors.type.message}</FormHelperText>
//           </FormControl>

//           <FormControl fullWidth sx={{ marginBottom: 2 }}>
//             <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="name-input">Name</InputLabel>
//             <Controller
//               name="name"
//               control={control}
//               render={({ field }) => (
//                 <CustomInput
//                   id="name-input"
//                   placeholder="Enter name..."
//                   {...field}
//                   error={!!errors.name}
//                 />
//               )}
//             />
//             <FormHelperText error={!!errors.name}>{errors.name?.message}</FormHelperText>
//           </FormControl>

//           <FormControl fullWidth sx={{ marginBottom: 2 }}>
//             <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="email-input">Email</InputLabel>
//             <Controller
//               name="email"
//               control={control}
//               render={({ field }) => (
//                 <CustomInput
//                   id="email-input"
//                   placeholder="Enter email..."
//                   {...field}
//                   error={!!errors.email}
//                 />
//               )}
//             />
//             <FormHelperText error={!!errors.email}>{errors.email?.message}</FormHelperText>
//           </FormControl>

//           <FormControl fullWidth sx={{ marginBottom: 2 }}>
//             <InputLabel shrink sx={{ ml: -1.4 }} htmlFor="phoneNumber-input">Phone Number</InputLabel>
//             <Controller
//               name="phoneNumber"
//               control={control}
//               render={({ field }) => (
//                 <CustomInput
//                   id="phoneNumber-input"
//                   placeholder="Enter phone number..."
//                   {...field}
//                   error={!!errors.phoneNumber}
//                 />
//               )}
//             />
//             <FormHelperText error={!!errors.phoneNumber}>{errors.phoneNumber?.message}</FormHelperText>
//           </FormControl>

//           <FormControlLabel
//             control={
//               <Controller
//                 name="iAgree"
//                 control={control}
//                 render={({ field }) => (
//                   <Checkbox {...field} checked={field.value} />
//                 )}
//               />
//             }
//             label="I agree to the terms and conditions"
//           />
//           <FormHelperText error={!!errors.iAgree}>{errors.iAgree?.message}</FormHelperText>

//           <FormControlLabel
//             control={
//               <Controller
//                 name="homeLoan"
//                 control={control}
//                 render={({ field }) => (
//                   <Checkbox {...field} checked={field.value} />
//                 )}
//               />
//             }
//             label="Interested in home loan"
//           />
//           <FormHelperText error={!!errors.homeLoan}>{errors.homeLoan?.message}</FormHelperText>

//           <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>
//             {leadId ? 'Update Lead' : 'Add Lead'}
//           </Button>
//         </form>
//       </Box>
//     </Drawer>
//   );
// };

// export default LeadForm;

// import { Box, FormControl, Typography } from '@mui/material'
// import React from 'react'
// import { Controller } from 'react-hook-form'

// const LeadForm = () => {
//   return (
//     <div>
//       <Box>
//         <Typography>
//           <FormControlLabel
//             control={
//               <Controller
//                 name="homeLoan"
//                 control={control}
//                 render={({ field }) => (
//                   <Checkbox {...field} checked={field.value} />
//                 )}
//               />
// </FromControlLabel>
//       </Typography>
//     </Box>
      
//     </div >
//   )
// }

// export default LeadForm




import React from 'react'

const LeadForm = () => {
  return (
    <div>
      
    </div>
  )
}

export default LeadForm
