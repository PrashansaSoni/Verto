import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  size?: number;
  open: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  size = 40,
  open = false
}) => {
  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      open={open}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <CircularProgress size={size} color="inherit" />
        {message && (
          <Typography variant="body1" color="inherit">
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay;
