import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { ChartDataPoint } from '../../api/statsApi';

interface ProyectosPorSectorChartProps {
  data: ChartDataPoint[];
}

const ProyectosPorSectorChart: React.FC<ProyectosPorSectorChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Proyectos por Sector
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 50, // Espacio para las etiquetas del eje X
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [value, 'N° Proyectos']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {/* Usamos un color diferente para esta categoría, por ejemplo, el color "info" del tema */}
            <Bar dataKey="value" name="N° Proyectos" fill={theme.palette.info.main} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProyectosPorSectorChart;
