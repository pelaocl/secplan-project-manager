import React from 'react';
import Slider from 'react-slick';
import { Box, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// --- PASO 1: IMPORTACIÓN DE ESTILOS (ESENCIAL) ---
// Estas dos líneas son la causa más común de problemas.
// Deben estar aquí para que el slider se vea y funcione.
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
// ---------------------------------------------------

interface ProjectImageSliderProps {
  imageUrls: string[];
}

// Componentes para las flechas de navegación
const NextArrow = (props: any) => {
    const { onClick } = props;
    return (
        <IconButton
            onClick={onClick}
            sx={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                zIndex: 2, color: 'white', bgcolor: 'rgba(0, 0, 0, 0.4)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
            }}
            size="small" aria-label="siguiente imagen"
        >
            <ArrowForwardIosIcon fontSize="inherit" />
        </IconButton>
    );
}

const PrevArrow = (props: any) => {
    const { onClick } = props;
    return (
        <IconButton
            onClick={onClick}
            sx={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                zIndex: 2, color: 'white', bgcolor: 'rgba(0, 0, 0, 0.4)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
            }}
            size="small" aria-label="imagen anterior"
        >
            <ArrowBackIosNewIcon fontSize="inherit" />
        </IconButton>
    );
}


const ProjectImageSlider: React.FC<ProjectImageSliderProps> = ({ imageUrls }) => {
    const settings = {
        dots: true,
        infinite: imageUrls.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        pauseOnHover: true,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

    return (
        // El contenedor principal debe tener altura y posición relativa
        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            <Slider {...settings}>
                {imageUrls.map((url, index) => (
                    // Usamos un <div> simple para cada slide, que es lo más compatible
                    <div key={index}>
                        <img 
                            src={url} 
                            alt={`Imagen del proyecto ${index + 1}`} 
                            style={{ 
                                width: '100%', 
                                height: '400px', // Asignamos una altura fija consistente con el contenedor de la página
                                objectFit: 'cover' // Asegura que la imagen cubra el espacio sin distorsionarse
                            }}
                            onError={(e) => { 
                                const target = e.currentTarget as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/1280x720/e0e0e0/757575?text=Imagen+No+Disponible'; 
                            }}
                        />
                    </div>
                ))}
            </Slider>
        </Box>
    );
};

export default ProjectImageSlider;
