import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { SuperficieDataPoint } from '../../api/statsApi'; // Creamos una interfaz específica para estos datos

// Define una interfaz para los datos de superficie
interface SuperficiePorTipologia {
  name: string;
  terreno: number;
  edificacion: number;
}

interface SuperficiePorTipologiaChartProps {
  data: SuperficiePorTipologia[];
}

const SuperficiePorTipologiaChart: React.FC<SuperficiePorTipologiaChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Superficie Proyectada por Tipología
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `${value} m²`} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="terreno" name="Superficie Terreno (m²)" fill={theme.palette.primary.light} />
            <Bar dataKey="edificacion" name="Superficie Edificada (m²)" fill={theme.palette.primary.dark} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SuperficiePorTipologiaChart;