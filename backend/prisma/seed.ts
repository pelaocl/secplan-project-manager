// backend/prisma/seed.ts
import { PrismaClient, Role, TipoMoneda, Prisma, EstadoTarea } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper para seleccionar un elemento aleatorio de un array
function randomElement<T>(arr: T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper para generar un número aleatorio en un rango
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Start seeding ...');

  // --- Clean existing data (optional, useful for development) ---
  console.log('Deleting existing data...');
  // Order is important due to foreign key constraints
  await prisma.userTaskChatStatus.deleteMany();
  await prisma.mensajeChatTarea.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.tarea.deleteMany();

  // Nullify optional foreign keys in Project before deleting Users or Lookups
  await prisma.project.updateMany({
    data: {
      proyectistaId: null,
      formuladorId: null,
      estadoId: null,
      unidadId: null,
      sectorId: null,
      lineaFinanciamientoId: null,
      programaId: null,
      etapaFinanciamientoId: null,
    }
  });
  // For M2M relation ProjectCollaborators, Prisma handles the join table if one side is deleted.
  // No direct updateMany needed for the join table itself.

  await prisma.project.deleteMany();
  await prisma.user.deleteMany(); // Borrar Users después de Proyectos
  await prisma.etiqueta.deleteMany();
  await prisma.programa.deleteMany(); // Programa depende de LineaFinanciamiento
  await prisma.lineaFinanciamiento.deleteMany();
  await prisma.etapaFinanciamiento.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.tipologiaProyecto.deleteMany(); // Tipologia es referenciada por Project
  await prisma.unidadMunicipal.deleteMany();
  await prisma.estadoProyecto.deleteMany();
  console.log('Existing data deleted.');

  // --- Seed Lookup Tables ---
  console.log('Seeding Lookup Tables...');
  const estadosProyecto = await prisma.estadoProyecto.createManyAndReturn({
    data: [
      { nombre: 'Idea' }, { nombre: 'Perfil' }, { nombre: 'Diseño' },
      { nombre: 'Ejecución' }, { nombre: 'Terminado' }, { nombre: 'Suspendido' }, { nombre: 'Cancelado' }
    ],
  });

  const unidadesMunicipales = await prisma.unidadMunicipal.createManyAndReturn({
    data: [
      { nombre: 'Arquitectura', abreviacion: 'ARQ' },
      { nombre: 'Asesoría Urbana', abreviacion: 'AU' },
      { nombre: 'Psat', abreviacion: 'PSAT' },
      { nombre: 'Ingeniería', abreviacion: 'ING' },
      { nombre: 'Formulación', abreviacion: 'FORM' },
    ],
  });

  const tipologiasProyecto = await prisma.tipologiaProyecto.createManyAndReturn({
    data: [
      { nombre: 'Espacio Público', abreviacion: 'ESP', colorChip: '#4caf50' }, // Verde
      { nombre: 'Mixto', abreviacion: 'MIX', colorChip: '#2196f3' }, // Azul
      { nombre: 'Vivienda', abreviacion: 'VIV', colorChip: '#ff9800' }, // Naranja
      { nombre: 'Infraestructura', abreviacion: 'INF', colorChip: '#795548' }, // Marrón
      { nombre: 'Activo No Financiero', abreviacion: 'ANF', colorChip: '#00bcd4' }, // Cyan
      { nombre: 'Equipamiento', abreviacion: 'EQP', colorChip: '#9c27b0' }, // Púrpura
    ],
  });

  const sectores = await prisma.sector.createManyAndReturn({
    data: [ { nombre: 'Centro Sur' }, { nombre: 'Centro Norte' }, { nombre: 'Valle Escondido' }, { nombre: 'Pedro de Valdivia' }, { nombre: 'Barrio Universitario' }, { nombre: 'Teniente Merino I' }, { nombre: 'Teniente Merino II'}, { nombre: 'Villa San Franciscos' } ],
  });

  const lineasFinanciamiento = await prisma.lineaFinanciamiento.createManyAndReturn({
    data: [ { nombre: 'FNDR' }, { nombre: 'SUBDERE' }, { nombre: 'MINVU' }, { nombre: 'FONDO MUNICIPAL' }, { nombre: 'OTRO' } ],
  });

  const programas = [];
  programas.push(await prisma.programa.create({ data: { nombre: 'FNDR', lineaFinanciamientoId: lineasFinanciamiento[0].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'PMU', lineaFinanciamientoId: lineasFinanciamiento[1].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'Pavimentos Participativos', lineaFinanciamientoId: lineasFinanciamiento[2].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'Proyectos Especiales Municipales', lineaFinanciamientoId: lineasFinanciamiento[3].id } }));


  const etapasFinanciamiento = await prisma.etapaFinanciamiento.createManyAndReturn({
    data: [ { nombre: 'RS (Recomendado)' }, { nombre: 'Admisible' }, { nombre: 'Convenio Mandato' }, { nombre: 'Licitación Pública' }, { nombre: 'Adjudicado' }, { nombre: 'En Observación' } ],
  });
  console.log('Lookup Tables seeded.');

  // --- Seed Etiquetas ---
  console.log('Seeding Etiquetas...');
  const etiquetaArq = await prisma.etiqueta.create({ data: { nombre: 'ARQUITECTO', color: '#f44336' } });
  const etiquetaProy = await prisma.etiqueta.create({ data: { nombre: 'PROYECTISTA', color: '#9c27b0' } });
  const etiquetaForm = await prisma.etiqueta.create({ data: { nombre: 'FORMULADOR', color: '#3f51b5' } });
  const etiquetaCoord = await prisma.etiqueta.create({ data: { nombre: 'COORDINADOR', color: '#009688' } });
  const etiquetaCivil = await prisma.etiqueta.create({ data: { nombre: 'ADMINISTRADOR', color: '#ffc107' } });
  console.log('Etiquetas seeded.');

  // --- Seed Users ---
  console.log('Seeding Users...');
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({ data: { email: 'admin@concepcion.cl', password: hashedPasswordAdmin, name: 'Administrador', role: Role.ADMIN, etiquetas: { connect: [{ id: etiquetaCoord.id }] } } });

  const hashedPasswordCoord = await bcrypt.hash('coord123', 10);
  const coordUser = await prisma.user.create({ data: { email: 'coordinador@concepcion.cl', password: hashedPasswordCoord, name: 'Coordinador', role: Role.COORDINADOR, etiquetas: { connect: [{ id: etiquetaCoord.id }, {id: etiquetaForm.id}] } } });

  const hashedPasswordUser = await bcrypt.hash('user123', 10); // Misma pass para todos los usuarios de ejemplo
  const user1 = await prisma.user.create({ data: { email: 'jalarcon@concepcion.cl', password: hashedPasswordUser, name: 'Jorge Alarcón', role: Role.USUARIO, etiquetas: { connect: [{ id: etiquetaArq.id }, { id: etiquetaProy.id }] } } });
  const user2 = await prisma.user.create({ data: { email: 'ahernandez@concepcion.cl', password: hashedPasswordUser, name: 'Alejandro Hernandez', role: Role.USUARIO, etiquetas: { connect: [{ id: etiquetaForm.id }] } } });
  const user3 = await prisma.user.create({ data: { email: 'pobanos@concepcion.cl', password: hashedPasswordUser, name: 'Pia Obanos', role: Role.USUARIO, isActive: false, etiquetas: { connect: [{ id: etiquetaCivil.id }, {id: etiquetaProy.id}] } } });
  const user4 = await prisma.user.create({ data: { email: 'cfigueroa@concepcion.cl', password: hashedPasswordUser, name: 'Claudio Figueroa', role: Role.USUARIO, etiquetas: { connect: [{ id: etiquetaArq.id }] } } });
  
  const allUsers = [adminUser, coordUser, user1, user2, user3, user4];
  console.log(`Seeded Users: ${allUsers.map(u => u.email).join(', ')}`);

  // --- Seed Projects (20 projects) ---
  console.log('Seeding Projects (20)...');
  const tipologiaCounters: { [key: string]: number } = {};
  const projectNames = [
    "Renovación Plaza Condell", "Centro Comunitario Barrio Norte", "Mejoramiento Luminarias Av. Alemania", "Ciclovía Costanera Biobío Tramo 1",
    "Construcción CESFAM Tucapel", "Ampliación Biblioteca Municipal", "Parque Fluvial Ribera Norte", "Sede Social Villa Cap",
    "Repavimentación Calle O'Higgins", "Mirador Cerro Caracol Etapa 2", "Skatepark Parque Ecuador", "Recuperación Laguna Lo Galindo",
    "Centro Cultural Aurora de Chile", "Polideportivo Nonguén", "Terminal de Buses Rurales", "Paseo Peatonal Aníbal Pinto",
    "Mercado Gastronómico Concepción", "Conexión Vial Pedro de Valdivia - Chiguayante", "Restauración Teatro Enrique Molina", "Museo de Historia de Concepción (Nuevo Edificio)"
  ];
  const projectImagePlaceholders = [
    "https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=600", // Plaza
    "https://images.pexels.com/photos/207983/pexels-photo-207983.jpeg?auto=compress&cs=tinysrgb&w=600", // Edificio
    "https://images.pexels.com/photos/534027/pexels-photo-534027.jpeg?auto=compress&cs=tinysrgb&w=600", // Calle
    "https://images.pexels.com/photos/1578794/pexels-photo-1578794.jpeg?auto=compress&cs=tinysrgb&w=600", // Ciclovia
    null, // Sin imagen
  ];

  for (let i = 0; i < 20; i++) {
    const selectedTipologia = randomElement(tipologiasProyecto)!;
    tipologiaCounters[selectedTipologia.abreviacion] = (tipologiaCounters[selectedTipologia.abreviacion] || 0) + 1;
    const correlative = String(tipologiaCounters[selectedTipologia.abreviacion]).padStart(3, '0');
    const codigoUnico = `${selectedTipologia.abreviacion}-${correlative}`;

    const nombreProyecto = projectNames[i] || `Proyecto de Ejemplo ${selectedTipologia.nombre} N°${correlative}`;
    const selectedEstado = randomElement(estadosProyecto)!;
    const selectedUnidad = randomElement(unidadesMunicipales)!;
    const selectedSector = randomElement(sectores)!;
    const selectedProyectista = randomElement(allUsers.filter(u => u.role === Role.USUARIO || u.role === Role.COORDINADOR)); // Puede ser null
    const selectedFormulador = randomElement(allUsers.filter(u => u.role === Role.USUARIO || u.role === Role.COORDINADOR)); // Puede ser null
    const selectedLinea = randomElement(lineasFinanciamiento)!;
    const programaCompatible = randomElement(programas.filter(p => p.lineaFinanciamientoId === selectedLinea.id)) || randomElement(programas)!;
    const selectedEtapa = randomElement(etapasFinanciamiento)!;
    const ano = randomNumber(2020, 2025);

    await prisma.project.create({
      data: {
        codigoUnico,
        nombre: nombreProyecto,
        descripcion: `Descripción detallada para ${nombreProyecto}, enfocado en mejorar la calidad de vida de los habitantes del sector ${selectedSector.nombre}. Este proyecto de tipología ${selectedTipologia.nombre} se encuentra en estado ${selectedEstado.nombre} y es gestionado por ${selectedUnidad.nombre}.`,
        imagenUrl: randomElement(projectImagePlaceholders),
        direccion: `Calle Ficticia ${randomNumber(100, 1000)}, ${selectedSector.nombre}`,
        superficieTerreno: randomNumber(500, 10000),
        superficieEdificacion: selectedTipologia.abreviacion === 'EP' || selectedTipologia.abreviacion === 'CV' ? null : randomNumber(100, 2000),
        ano,
        proyectoPriorizado: Math.random() > 0.5,
        estadoId: selectedEstado.id,
        unidadId: selectedUnidad.id,
        tipologiaId: selectedTipologia.id,
        sectorId: selectedSector.id,
        proyectistaId: selectedProyectista?.id,
        formuladorId: selectedFormulador?.id,
        // colaboradores: { connect: Math.random() > 0.7 ? [randomElement(allUsers.filter(u => u.id !== selectedProyectista?.id && u.id !== selectedFormulador?.id))!.id] : [] },
        lineaFinanciamientoId: selectedLinea.id,
        programaId: programaCompatible.id,
        etapaFinanciamientoId: selectedEtapa.id,
        monto: new Prisma.Decimal(randomNumber(50000, 300000) * 1000),
        tipoMoneda: Math.random() > 0.7 ? TipoMoneda.UF : TipoMoneda.CLP,
        codigoExpediente: Math.random() > 0.5 ? `EXP-${selectedTipologia.abreviacion}-${ano}-${randomNumber(100,200)}` : null,
        fechaPostulacion: Math.random() > 0.6 ? new Date(`${ano}-${randomNumber(1,12)}-${randomNumber(1,28)}`) : null,
        montoAdjudicado: Math.random() > 0.7 ? new Prisma.Decimal(randomNumber(40000, 280000) * 1000) : null,
        codigoLicitacion: Math.random() > 0.4 ? `LIC-${selectedTipologia.abreviacion}-${correlative}` : null,
        // --- CAMBIO AQUÍ ---
        location_point: Math.random() > 0.3 
            ? { type: "Point", coordinates: [-73.0400 - (Math.random() * 0.1), -36.8200 - (Math.random() * 0.1)] } 
            : Prisma.DbNull, // Usar Prisma.DbNull en lugar de null
        
        // --- AÑADIDO PARA AREA_POLYGON (manéjalo de forma similar si lo necesitas) ---
        area_polygon: Math.random() > 0.5 
            ? { type: "Polygon", coordinates: [[[-73.05, -36.81], [-73.06, -36.81], [-73.06, -36.82], [-73.05, -36.82], [-73.05, -36.81]]]} // Ejemplo de polígono
            : Prisma.DbNull, // Usar Prisma.DbNull
      },
    });
    console.log(`Seeded Project: ${codigoUnico} - ${nombreProyecto}`);
  }
  console.log('20 Projects seeded.');

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error("Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  });