import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { ChartDataPoint } from '../../api/statsApi';

interface ProyectosPorLineaChartProps {
  data: ChartDataPoint[];
}

// Función para formatear números grandes en el eje X (ej. 150M)
const formatXAxisTick = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`; // Billones (miles de millones)
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`; // Millones
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`; // Miles
  }
  return value.toString();
};

const ProyectosPorLineaChart: React.FC<ProyectosPorLineaChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      {/* Título del Gráfico Corregido */}
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Inversión por Programa
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 0, // Más espacio para nombres largos de programa y línea
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            {/* Eje X ahora muestra Monto y usa el formateador */}
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickFormatter={formatXAxisTick} />
            <YAxis
              type="category"
              dataKey="name"
              width={160} // Ancho aumentado para las etiquetas del eje Y
              tick={{ fontSize: 11 }} // Fuente un poco más pequeña si es necesario
              interval={0}
            />
            {/* Tooltip ahora formatea como moneda */}
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value), 'Monto Invertido']}
            />
            {/* Leyenda y Barra actualizadas */}
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="value" name="Monto Invertido (CLP)" fill={theme.palette.secondary.main}>
              <LabelList dataKey="value" position="right" formatter={formatXAxisTick} style={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProyectosPorLineaChart;
