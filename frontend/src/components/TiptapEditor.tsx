// frontend/src/components/TiptapEditor.tsx
import React from 'react';
import { useEditor, EditorContent, EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline'; // Tiptap requiere Underline como extensión separada
import EditorToolbar from './EditorToolbar'; // La toolbar que acabamos de crear
import { Box } from '@mui/material';
import Placeholder from '@tiptap/extension-placeholder'; // Importa la extensión Placeholder

interface TiptapEditorProps {
  value: string | null; // HTML string
  onChange: (htmlContent: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showHeadersInToolbar?: boolean; // <-- NUEVA PROP (default a true)
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, placeholder, disabled = false, showHeadersInToolbar = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desactivamos los que configuraremos manualmente o no queremos del StarterKit
        heading: false, // Usaremos nuestra propia configuración de Heading
        // Puedes desactivar otros como blockquote, horizontalRule, etc., si no los necesitas
        // codeBlock: false,
        // blockquote: false,
      }),
      Heading.configure({ // Solo niveles H1, H2, H3
        levels: [1, 2, 3],
      }),
      Underline, // Para el subrayado
      Link.configure({
        openOnClick: false, // Para que un clic no abra el enlace en modo edición
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer nofollow', // Buena práctica para enlaces externos
        },
      }),
      Image.configure({
        inline: false, // Permite que las imágenes sean bloques, o true para inline
        allowBase64: false, // No permitir base64, forzamos src
        HTMLAttributes: {
            class: 'tiptap-image', // Para estilos CSS si es necesario
        },
      }),
    ],
    content: value || '', // Contenido inicial
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prosemirror-editor-class', // Si quieres una clase específica en el editor
      },
    },
    onUpdate: ({ editor: currentEditor }: EditorEvents['update']) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText().trim();
      // Devolver null si el contenido (sin contar etiquetas) está vacío
      onChange(text ? html : null);
    },
  });

  // Sincronizar el contenido del editor si la prop 'value' cambia desde fuera
  // Esto es importante para React Hook Form cuando resetea el formulario o carga valores iniciales
  React.useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      // Solo actualiza si el valor externo es diferente al interno para evitar bucles
      // y problemas de cursor.
      // Es importante que 'value' sea el HTML sanitizado si se está mostrando lo que se guardó.
      // Pero al editar, 'value' es el HTML del editor.
      editor.commands.setContent(value || '', false); // false para no emitir update event
    }
  }, [value, editor]);


  return (
      <Box sx={{ 
          border: 1, borderColor: 'divider', borderRadius: 1,
          bgcolor: disabled ? 'action.disabledBackground' : 'background.paper', // Fondo si está deshabilitado
          '& .ProseMirror': { 
              minHeight: '150px', 
              p: 1.5, // Un poco más de padding interno
              '&:focus': {outline: 'none'} 
          },
          // Estilo para el placeholder de Tiptap
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)', // Usa el atributo data-placeholder
              float: 'left',
              color: 'text.disabled', // Usa un color del tema
              pointerEvents: 'none',
              height: 0,
          }
      }}>
      {!disabled && <EditorToolbar editor={editor} showHeaders={showHeadersInToolbar} />} {/* Pasar la prop */}
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TiptapEditor;