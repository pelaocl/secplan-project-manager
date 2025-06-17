import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { ChartDataPoint } from '../../api/statsApi';

interface ProyectosPorLineaChartProps {
  data: ChartDataPoint[];
}

const ProyectosPorLineaChart: React.FC<ProyectosPorLineaChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Proyectos por Línea de Financiamiento
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical" // <-- Esto lo hace un gráfico de barras horizontales
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 100, // Más espacio a la izquierda para los nombres largos
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={150} // Ancho para las etiquetas del eje Y
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [value, 'N° Proyectos']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="value" name="N° Proyectos" fill={theme.palette.secondary.main}>
              <LabelList dataKey="value" position="right" style={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProyectosPorLineaChart;
