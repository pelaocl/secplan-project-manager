import React from 'react';
import { Calendar, dateFnsLocalizer, EventProps, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { Box, Paper, Typography, Tooltip, IconButton } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Task } from '../../types';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  tasks: Task[];
  onViewDetails: (task: Task) => void;
  date: Date;
  view: View;
  onNavigate: (newDate: Date) => void;
  onView: (newView: View) => void;
}

const CustomEvent: React.FC<EventProps<Task>> = ({ event, title }) => {
    const handleExportToGoogleCalendar = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!event.fechaPlazo) return;

        const startDate = new Date(event.fechaPlazo);
        const googleFormat = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 8);
        
        const googleCalendarUrl = new URL('https://www.google.com/calendar/render');
        googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
        googleCalendarUrl.searchParams.append('text', `[SECPLAN] Tarea: ${event.titulo}`);
        const nextDay = new Date(startDate);
        nextDay.setDate(startDate.getDate() + 1);
        googleCalendarUrl.searchParams.append('dates', `${googleFormat(startDate)}/${googleFormat(nextDay)}`);
        googleCalendarUrl.searchParams.append('details', `Proyecto: ${event.proyecto?.nombre}\nVer detalles en la aplicación SECPLAN.`);

        window.open(googleCalendarUrl.toString(), '_blank');
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '2px 4px', gap: 1, cursor: 'pointer' }}>
            <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                {title}
            </Typography>
            <Tooltip title="Añadir a Google Calendar">
                 <IconButton 
                    size="small" 
                    onClick={handleExportToGoogleCalendar}
                    sx={{ p: 0.2, color: 'inherit', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                    <GoogleIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

// --- CORRECCIÓN EN LA FIRMA DE LA FUNCIÓN ---
const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onViewDetails, date, view, onNavigate, onView }) => {
  const events = tasks
    .filter(task => !!task.fechaPlazo)
    .map(task => ({
      ...task,
      title: task.titulo,
      start: new Date(task.fechaPlazo!),
      end: new Date(task.fechaPlazo!),
      allDay: true,
    }));

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2, height: '75vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture='es'
        messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
        }}
        onSelectEvent={(event) => onViewDetails(event)}
        components={{
            event: CustomEvent,
        }}
        // Ahora estas props se reciben correctamente
        date={date}
        view={view}
        onNavigate={onNavigate}
        onView={onView}
      />
    </Paper>
  );
};

export default CalendarView;
