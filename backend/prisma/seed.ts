import { PrismaClient, Role, TipoMoneda, Prisma, EstadoTarea, PrioridadTarea } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- Helpers ---
function randomElement<T>(arr: T[]): T {
  if (!arr || arr.length === 0) throw new Error("El array para randomElement no puede estar vacío.");
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Start seeding ...');

  // --- Clean existing data ---
  console.log('Deleting existing data...');
  await prisma.userTaskChatStatus.deleteMany();
  await prisma.mensajeChatTarea.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.tarea.deleteMany();
  await prisma.project.updateMany({ data: { proyectistaId: null, formuladorId: null }});
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.etiqueta.deleteMany();
  await prisma.programa.deleteMany();
  await prisma.lineaFinanciamiento.deleteMany();
  await prisma.etapaFinanciamiento.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.tipologiaProyecto.deleteMany();
  await prisma.unidadMunicipal.deleteMany();
  await prisma.estadoProyecto.deleteMany();
  console.log('Existing data deleted.');

  // --- Seed Lookup Tables ---
  console.log('Seeding Lookup Tables...');
  const estadosProyecto = await prisma.estadoProyecto.createManyAndReturn({
    data: [ { nombre: 'Estudios Preliminares' }, { nombre: 'Diseño' }, { nombre: 'Formulación' }, { nombre: 'Observado' }, { nombre: 'Postulado' }, { nombre: 'En Revisión' }, { nombre: 'En Reevaluación' }, { nombre: 'Aprobado'}, { nombre: 'Paralizado'} ],
  });
  const unidadesMunicipales = await prisma.unidadMunicipal.createManyAndReturn({
    data: [ { nombre: 'Arquitectura', abreviacion: 'ARQ' }, { nombre: 'Asesoría Urbana', abreviacion: 'AU' }, { nombre: 'Psat', abreviacion: 'PSAT' }, { nombre: 'Ingeniería', abreviacion: 'ING' }, { nombre: 'Formulación', abreviacion: 'FORM' } ],
  });
  const tipologiasProyecto = await prisma.tipologiaProyecto.createManyAndReturn({
    data: [ { nombre: 'Espacio Público', abreviacion: 'ESP', colorChip: '#4caf50' }, { nombre: 'Mixto', abreviacion: 'MIX', colorChip: '#2196f3' }, { nombre: 'Vivienda', abreviacion: 'VIV', colorChip: '#ff9800' }, { nombre: 'Infraestructura', abreviacion: 'INF', colorChip: '#795548' }, { nombre: 'Activo No Financiero', abreviacion: 'ANF', colorChip: '#00bcd4' }, { nombre: 'Equipamiento', abreviacion: 'EQP', colorChip: '#9c27b0' } ],
  });
  const sectores = await prisma.sector.createManyAndReturn({
    data: [ { nombre: 'Centro Sur' }, { nombre: 'Centro Norte' }, { nombre: 'Valle Escondido' }, { nombre: 'Pedro de Valdivia' }, { nombre: 'Barrio Universitario' }, { nombre: 'Teniente Merino I' }, { nombre: 'Teniente Merino II'}, { nombre: 'Villa San Francisco' } ],
  });
  const lineasFinanciamiento = await prisma.lineaFinanciamiento.createManyAndReturn({
    data: [ { nombre: 'GORE' }, { nombre: 'SUBDERE' }, { nombre: 'MINVU' }, { nombre: 'MUNICIPAL' }, { nombre: 'OTRO' } ],
  });
  const programas = [];
  programas.push(await prisma.programa.create({ data: { nombre: 'FNDR', lineaFinanciamientoId: lineasFinanciamiento[0].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'PMU', lineaFinanciamientoId: lineasFinanciamiento[1].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'Pavimentos Participativos', lineaFinanciamientoId: lineasFinanciamiento[2].id } }));
  programas.push(await prisma.programa.create({ data: { nombre: 'Proyectos Especiales Municipales', lineaFinanciamientoId: lineasFinanciamiento[3].id } }));
  const etapasFinanciamiento = await prisma.etapaFinanciamiento.createManyAndReturn({
    data: [ { nombre: 'Adquisición' }, { nombre: 'Ejecución' }, { nombre: 'Reposición' }, { nombre: 'Estudio' } ],
  });
  console.log('Lookup Tables seeded.');

  // --- Seed Etiquetas ---
  console.log('Seeding Etiquetas...');
  const etiquetaProy = await prisma.etiqueta.create({ data: { nombre: 'PROYECTISTA', color: '#9c27b0' } });
  const etiquetaCoord = await prisma.etiqueta.create({ data: { nombre: 'COORDINADOR', color: '#009688' } });
  const etiquetaAdmin = await prisma.etiqueta.create({ data: { nombre: 'ADMINISTRADOR', color: '#ffc107' } });
  console.log('Etiquetas seeded.');

  // --- Seed Users ---
  console.log('Seeding Users...');
  const hashedPasswordDefault = await bcrypt.hash('secplan123', 10);
  
  const adminUser = await prisma.user.create({ data: { email: 'admin@concepcion.cl', password: hashedPasswordDefault, name: 'Administrador', role: Role.ADMIN, etiquetas: { connect: [{ id: etiquetaAdmin.id }] } } });
  const coordUser = await prisma.user.create({ data: { email: 'coordinador@concepcion.cl', password: hashedPasswordDefault, name: 'Coordinador', role: Role.COORDINADOR, etiquetas: { connect: [{ id: etiquetaCoord.id }] } } });

  const usersToCreate = [
    { email: 'rodolfo.morales@concepcion.cl', name: 'Rodolfo Morales' }, { email: 'emontes@concepcion.cl', name: 'Ethielly Montes' }, { email: 'ecancino@concepcion.cl', name: 'Eduardo Cancino' },
    { email: 'jjara@concepcion.cl', name: 'Javier Jara' }, { email: 'fojeda@concepcion.cl', name: 'Francisco Ojeda' }, { email: 'rcarrasco@concepcion.cl', name: 'Robinson Carrasco' },
    { email: 'moviedo@concepcion.cl', name: 'Mauricio Oviedo' }, { email: 'ccosialls@concepcion.cl', name: 'Catalina Cosialls' }, { email: 'cenriquez@concepcion.cl', name: 'Carlos Enriquez' },
    { email: 'calmanza@concepcion.cl', name: 'Carla Almanza' }, { email: 'agallegos@concepcion.cl', name: 'Alejandro Gallegos' }, { email: 'catalina.marianjel@concepcion.cl', name: 'Catalina Marianjel' },
    { email: 'smoya@concepcion.cl', name: 'Sergio Moya' }, { email: 'culloa@concepcion.cl', name: 'Cesar Ulloa' }, { email: 'camilamerino@concepcion.cl', name: 'Camila Merino' },
    { email: 'carlos.arriagada@concepcion.cl', name: 'Carlos Arriagada' }, { email: 'svallejos@concepcion.cl', name: 'Sergio Vallejos' }, { email: 'mvillablanca@concepcion.cl', name: 'Marilyn Villablanca' },
    { email: 'ghernandez@concepcion.cl', name: 'Gerson Hernández' }, { email: 'cmanriquez@concepcion.cl', name: 'Carolina Manríquez' }, { email: 'nmaldonado@concepcion.cl', name: 'Natalia Maldonado' },
    { email: 'joselinmunoz@concepcion.cl', name: 'Joselin Muñoz' }, { email: 'kruiz@concepcion.cl', name: 'Karen Ruiz' }, { email: 'lorena.campos@concepcion.cl', name: 'Lorena Campos' },
    { email: 'krudiger@concepcion.cl', name: 'Karin Rüdiger' }, { email: 'jalarcon@concepcion.cl', name: 'Jorge Alarcón' }, { email: 'pobanos@concepcion.cl', name: 'Pia Obanos Abuter' },
    { email: 'ahernandez@concepcion.cl', name: 'Alejandro Hernandez' }, { email: 'dvargas@concepcion.cl', name: 'Danilo Vargas' }, { email: 'cfigueroa@concepcion.cl', name: 'Claudio Figueroa' },
  ];
  
  const createdUsers = await Promise.all(
    usersToCreate.map(user => prisma.user.create({
      data: { ...user, password: hashedPasswordDefault, role: Role.USUARIO, etiquetas: { connect: [{ id: etiquetaProy.id }] } }
    }))
  );
  
  const allUsers = [adminUser, coordUser, ...createdUsers];
  console.log(`Seeded ${allUsers.length} Users.`);

  // --- Seed Projects (50) and Tasks (2-8 per project) ---
  console.log('Seeding 50 Projects and their Tasks...');
  const tipologiaCounters: { [key: string]: number } = {};
  const projectNames = [ "Renovación Plaza Condell", "Centro Comunitario Barrio Norte", "Mejoramiento Luminarias Av. Alemania", "Ciclovía Costanera Biobío Tramo 1", "Construcción CESFAM Tucapel", "Ampliación Biblioteca Municipal", "Parque Fluvial Ribera Norte", "Sede Social Villa Cap", "Repavimentación Calle O'Higgins", "Mirador Cerro Caracol Etapa 2", "Skatepark Parque Ecuador", "Recuperación Laguna Lo Galindo", "Centro Cultural Aurora de Chile", "Polideportivo Nonguén", "Terminal de Buses Rurales", "Paseo Peatonal Aníbal Pinto", "Mercado Gastronómico Concepción", "Conexión Vial Pedro de Valdivia - Chiguayante", "Restauración Teatro Enrique Molina", "Museo de Historia de Concepción", "Rehabilitación de Fachadas Edificio Tribunales", "Construcción de Cancha Sintética Bicentenario", "Mejoramiento Integral Parque Ecuador", "Diseño Eje Cívico Barros Arana", "Punto Limpio Sector Lomas de San Andrés", "Habilitación de Huertos Urbanos Comunitarios", "Instalación de Postes de Carga para Vehículos Eléctricos", "Restauración del Arco de Medicina UdeC", "Modernización del Alumbrado Público a LED - Sector Centro", "Diseño de Nuevo Acceso a la Comuna por Ruta 160", "Construcción de Caniles en Parque Metropolitano", "Mejoramiento de Veredas y Aceras - Plan Cuadrante Norte", "Semaforización Inteligente en Av. Los Carrera", "Centro de Día para el Adulto Mayor Pedro de Valdivia", "Diseño de Parque Acuático Popular en Llacolén", "Recuperación de Espacio Público en Plaza Cruz", "Construcción de Centro de Artes Escénicas", "Mejoramiento de Multicanchas en Sector Puchacay", "Habilitación de Ruta Patrimonial del Muralismo", "Diseño de Borde Costero en Desembocadura del Río Biobío", "Construcción de Jardín Infantil en Sector Palomares", "Plan Maestro para el Desarrollo del Barrio Estación", "Remodelación de Gimnasio Municipal", "Instalación de Juegos de Agua en Plaza Bicentenario", "Mejoramiento de Escaleras y Pasajes en Cerros de Concepción", "Diseño de Centro de Emprendimiento e Innovación", "Estación Intermodal de Transporte Público", "Construcción de Centro de Atención para Mascotas", "Nuevo Puente Peatonal sobre Estero Nonguén", "Plan de Reforestación Urbana en Ejes Principales" ];
  const taskTitles = [ "Elaborar informe de factibilidad", "Revisar planos arquitectónicos", "Solicitar presupuesto a proveedores", "Coordinar reunión de equipo inicial", "Preparar presentación para revisión", "Validar especificaciones técnicas", "Realizar levantamiento topográfico", "Gestionar permisos municipales", "Actualizar cronograma de proyecto", "Desarrollar modelo 3D conceptual", "Generar informe de impacto ambiental", "Cotizar materiales de construcción", "Redactar bases de licitación" ];

  for (let i = 0; i < 50; i++) {
    const selectedTipologia = randomElement(tipologiasProyecto)!;
    tipologiaCounters[selectedTipologia.abreviacion] = (tipologiaCounters[selectedTipologia.abreviacion] || 0) + 1;
    const correlative = String(tipologiaCounters[selectedTipologia.abreviacion]).padStart(3, '0');
    const codigoUnico = `${selectedTipologia.abreviacion}-${correlative}`;

    const nombreProyecto = projectNames[i] || `Proyecto Genérico ${selectedTipologia.nombre} N°${correlative}`;
    const ano = randomNumber(2020, 2025);
    const selectedProyectista = randomElement(allUsers.filter(u => u.role !== Role.ADMIN));

    const newProject = await prisma.project.create({
      data: {
        codigoUnico,
        nombre: nombreProyecto,
        descripcion: `Descripción detallada para ${nombreProyecto}.`,
        // --- CORRECCIÓN AQUÍ ---
        imageUrls: Math.random() > 0.6 ? [`https://picsum.photos/seed/${codigoUnico}/800/600`] : [],
        direccion: `Calle Ficticia ${randomNumber(100, 1000)}, ${randomElement(sectores)!.nombre}`,
        superficieTerreno: randomNumber(500, 10000),
        ano,
        proyectoPriorizado: Math.random() > 0.5,
        estadoId: randomElement(estadosProyecto)!.id,
        unidadId: randomElement(unidadesMunicipales)!.id,
        tipologiaId: selectedTipologia.id,
        sectorId: randomElement(sectores)!.id,
        proyectistaId: selectedProyectista?.id,
        formuladorId: randomElement(allUsers.filter(u => u.id !== selectedProyectista?.id))?.id,
        lineaFinanciamientoId: randomElement(lineasFinanciamiento)!.id,
        programaId: randomElement(programas)!.id,
        etapaFinanciamientoId: randomElement(etapasFinanciamiento)!.id,
        monto: new Prisma.Decimal(randomNumber(50, 500) * 1000000),
        location_point: Prisma.DbNull,
        area_polygon: Prisma.DbNull,
      },
    });

    // --- Crear Tareas para el Proyecto Creado ---
    const numTasks = randomNumber(2, 8);
    for (let j = 0; j < numTasks; j++) {
      const today = new Date();
      const randomDueDate = randomDate(new Date(new Date().setMonth(today.getMonth() - 2)), new Date(new Date().setMonth(today.getMonth() + 4)));
      const taskCreator = randomElement([adminUser, coordUser])!;
      const taskAssignee = randomElement(allUsers.filter(u => u.role === Role.USUARIO))!;

      await prisma.tarea.create({
        data: {
          titulo: `${randomElement(taskTitles)!} - ${newProject.nombre.substring(0, 15)}...`,
          descripcion: `Descripción de la tarea de ejemplo número ${j+1}.`,
          proyectoId: newProject.id,
          creadorId: taskCreator.id,
          asignadoId: taskAssignee.id,
          estado: randomElement([EstadoTarea.PENDIENTE, EstadoTarea.PENDIENTE, EstadoTarea.EN_PROGRESO, EstadoTarea.EN_PROGRESO, EstadoTarea.EN_REVISION, EstadoTarea.COMPLETADA])!,
          prioridad: randomElement([PrioridadTarea.ALTA, PrioridadTarea.MEDIA, PrioridadTarea.MEDIA, PrioridadTarea.BAJA])!,
          fechaPlazo: randomDueDate,
        }
      });
    }
    console.log(`Seeded Project: ${codigoUnico} con ${numTasks} tareas.`);
  }
  console.log('50 Projects and their tasks seeded.');

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
