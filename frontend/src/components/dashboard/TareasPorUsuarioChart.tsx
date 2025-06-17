import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { ChartDataPoint } from '../../api/statsApi';

interface TareasPorUsuarioChartProps {
  data: ChartDataPoint[];
}

const TareasPorUsuarioChart: React.FC<TareasPorUsuarioChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Tareas Activas por Usuario
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 60, // Más espacio abajo para las etiquetas inclinadas
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [value, 'Tareas Activas']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="value" name="N° Tareas Activas" fill={theme.palette.warning.main} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default TareasPorUsuarioChart;
