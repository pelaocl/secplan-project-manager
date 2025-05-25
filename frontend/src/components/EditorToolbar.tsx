// frontend/src/components/EditorToolbar.tsx
import React from 'react';
import { Editor } from '@tiptap/react';
import { IconButton, ToggleButton, ToggleButtonGroup, Divider, Box, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import LooksOneIcon from '@mui/icons-material/LooksOne'; // Para H1
import LooksTwoIcon from '@mui/icons-material/LooksTwo'; // Para H2
import Looks3Icon from '@mui/icons-material/Looks3'; // Para H3
import NotesIcon from '@mui/icons-material/Notes'; // Para Párrafo

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Ingresa la URL del enlace:', previousUrl);

    if (url === null) return; // Cancelado
    if (url === '') { // Quitar enlace
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };
  
  const addImage = () => {
    const url = window.prompt('Ingresa la URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', borderBottom: 1, borderColor: 'divider', p: 0.5, gap: 0.5, mb:1 }}>
      <ToggleButtonGroup size="small" exclusive aria-label="text formatting">
        <Tooltip title="Párrafo">
          <ToggleButton
            value="paragraph"
            selected={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            aria-label="Párrafo"
          >
            <NotesIcon />
          </ToggleButton>
        </Tooltip>
        {[1, 2, 3].map((level) => (
          <Tooltip title={`Encabezado ${level}`} key={level}>
            <ToggleButton
              value={`h${level}`}
              selected={editor.isActive('heading', { level })}
              onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
              aria-label={`Encabezado ${level}`}
            >
              {level === 1 && <LooksOneIcon />}
              {level === 2 && <LooksTwoIcon />}
              {level === 3 && <Looks3Icon />}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <ToggleButtonGroup size="small" aria-label="text formatting">
        <Tooltip title="Negrita (Ctrl+B)">
            <ToggleButton value="bold" selected={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita">
                <FormatBoldIcon />
            </ToggleButton>
        </Tooltip>
        <Tooltip title="Cursiva (Ctrl+I)">
            <ToggleButton value="italic" selected={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva">
                <FormatItalicIcon />
            </ToggleButton>
        </Tooltip>
        <Tooltip title="Subrayado (Ctrl+U)">
            <ToggleButton value="underline" selected={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Subrayado">
                <FormatUnderlinedIcon />
            </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <ToggleButtonGroup size="small" aria-label="list formatting">
        <Tooltip title="Lista Numerada">
            <ToggleButton value="orderedList" selected={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista Numerada">
                <FormatListNumberedIcon />
            </ToggleButton>
        </Tooltip>
        <Tooltip title="Lista con Viñetas">
            <ToggleButton value="bulletList" selected={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista con Viñetas">
                <FormatListBulletedIcon />
            </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <Tooltip title="Insertar/Editar Enlace">
        <IconButton size="small" onClick={setLink} color={editor.isActive('link') ? 'primary' : 'default'} aria-label="Insertar Enlace">
            <LinkIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Insertar Imagen desde URL">
        <IconButton size="small" onClick={addImage} aria-label="Insertar Imagen">
            <ImageIcon />
        </IconButton>
      </Tooltip>
      <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
      <Tooltip title="Limpiar Formato">
        <IconButton size="small" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} aria-label="Limpiar Formato">
            <FormatClearIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default EditorToolbar;