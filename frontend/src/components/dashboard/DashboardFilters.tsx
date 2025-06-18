import React from 'react';
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, Button, Paper } from '@mui/material';
import { LookupDataResponse } from '../../api/lookupApi';

// Define la estructura de los filtros que este componente manejará
export interface Filters {
  ano?: number | '';
  tipologiaId?: number | '';
  estadoId?: number | '';
  unidadId?: number | '';
}

interface DashboardFiltersProps {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  lookupData: LookupDataResponse | null;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  lookupData
}) => {
  // Generar una lista de años (ej. desde 2020 hasta el año actual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    onFilterChange({
      ...filters,
      [event.target.name as string]: event.target.value,
    });
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Año</InputLabel>
            <Select
              name="ano"
              value={filters.ano || ''}
              label="Año"
              onChange={(e) => onFilterChange({ ...filters, ano: e.target.value as number | '' })}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {years.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small" disabled={!lookupData}>
            <InputLabel>Tipología</InputLabel>
            <Select
              name="tipologiaId"
              value={filters.tipologiaId || ''}
              label="Tipología"
              onChange={(e) => onFilterChange({ ...filters, tipologiaId: e.target.value as number | '' })}
            >
              <MenuItem value=""><em>Todas</em></MenuItem>
              {lookupData?.tipologias.map(option => (
                <MenuItem key={option.id} value={option.id}>{option.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small" disabled={!lookupData}>
            <InputLabel>Estado del Proyecto</InputLabel>
            <Select
              name="estadoId"
              value={filters.estadoId || ''}
              label="Estado del Proyecto"
              onChange={(e) => onFilterChange({ ...filters, estadoId: e.target.value as number | '' })}
            >
              <MenuItem value=""><em>Todos</em></MenuItem>
              {lookupData?.estados.map(option => (
                <MenuItem key={option.id} value={option.id}>{option.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small" disabled={!lookupData}>
            <InputLabel>Unidad Municipal</InputLabel>
            <Select
              name="unidadId"
              value={filters.unidadId || ''}
              label="Unidad Municipal"
              onChange={(e) => onFilterChange({ ...filters, unidadId: e.target.value as number | '' })}
            >
              <MenuItem value=""><em>Todas</em></MenuItem>
              {lookupData?.unidades.map(option => (
                <MenuItem key={option.id} value={option.id}>{option.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
            <Grid item>
                <Button onClick={onClearFilters}>Limpiar Filtros</Button>
            </Grid>
            <Grid item>
                <Button variant="contained" onClick={onApplyFilters}>Aplicar Filtros</Button>
            </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DashboardFilters;
