// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material'; // Asegúrate de importar Container

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  timestamp: Date | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
        hasError: false, 
        error: null, 
        errorInfo: null,
        timestamp: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de fallback.
    return { hasError: true, error, timestamp: new Date() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aquí es donde logueamos el error de forma segura
    console.groupCollapsed(
        `[ErrorBoundary] Error Capturado a las ${this.state.timestamp?.toLocaleTimeString()}`
    );
    console.log("Mensaje del Error Original:", error?.message);
    console.log("Stack del Error Original:", error?.stack);
    console.log("Información del Componente (Stack):", errorInfo?.componentStack);
    
    // Intentar loguear el objeto de error completo de forma más segura
    try {
      console.log("Objeto de Error Completo (stringificado):", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.log("Objeto de Error Completo (no se pudo stringificar completamente, mostrando directamente):", error);
    }
    console.groupEnd();

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de fallback.
      return (
        <Container maxWidth="md" sx={{ mt: 4, py: 3 }}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {this.props.fallbackMessage || "Ha ocurrido un error inesperado"}
            </Typography>
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {this.state.error?.message || "No se pudo cargar esta sección."}
            </Alert>
            
            {/* Muestra más detalles en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ 
                mt: 2, 
                p: 1.5, 
                border: '1px solid #ccc', 
                borderRadius: 1, 
                maxHeight: 300, 
                overflowY: 'auto', 
                textAlign: 'left', 
                whiteSpace: 'pre-wrap', 
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5'
              }}>
                <Typography variant="subtitle2" gutterBottom>Detalles Técnicos:</Typography>
                <strong>Error Stack:</strong>
                <div>{this.state.error?.stack}</div>
                <br/>
                <strong>Component Stack:</strong>
                <div>{this.state.errorInfo?.componentStack}</div>
              </Box>
            )}
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()} 
              sx={{ mt: 3 }}
            >
              Recargar la Página
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;