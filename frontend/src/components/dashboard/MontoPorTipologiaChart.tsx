import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { ChartDataPoint } from '../../api/statsApi'; // Importamos el tipo que ya definimos

interface MontoPorTipologiaChartProps {
  data: ChartDataPoint[];
}

// Función para formatear números grandes en el eje Y (ej. 150M)
const formatYAxisTick = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`; // Billones
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`; // Millones
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`; // Miles
  }
  return value.toString();
};

const MontoPorTipologiaChart: React.FC<MontoPorTipologiaChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Inversión por Tipología de Proyecto
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 30, // Más espacio a la izquierda para los números grandes
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxisTick} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value), 'Monto']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="value" name="Monto (CLP)" fill={theme.palette.primary.main} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default MontoPorTipologiaChart;