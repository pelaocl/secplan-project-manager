// CORREGIDO: Importa Prisma junto con PrismaClient y los Enums
import { PrismaClient, Role, TipoMoneda, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Clean existing data (optional, useful for development) ---
  // Be careful in production!
  console.log('Deleting existing data...');
  await prisma.tarea.deleteMany(); // Borrar dependientes primero
  // CORREGIDO: Eliminadas líneas updateMany que fallaban y eran redundantes antes de deleteMany
  // Desconectar FKs opcionales en Project antes de borrar Users (si aplica)
  await prisma.project.updateMany({ data: { proyectistaId: null, formuladorId: null }});
  await prisma.project.deleteMany();
  await prisma.user.deleteMany(); // Borrar Users después de Projectos que los referencian
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
  const estado1 = await prisma.estadoProyecto.create({ data: { nombre: 'Idea' } });
  const estado2 = await prisma.estadoProyecto.create({ data: { nombre: 'Perfil' } });
  const estado3 = await prisma.estadoProyecto.create({ data: { nombre: 'Diseño' } });
  const estado4 = await prisma.estadoProyecto.create({ data: { nombre: 'Ejecución' } });
  const estado5 = await prisma.estadoProyecto.create({ data: { nombre: 'Terminado' } });

  const unidad1 = await prisma.unidadMunicipal.create({ data: { nombre: 'Secretaría de Planificación', abreviacion: 'SECPLAN' } });
  const unidad2 = await prisma.unidadMunicipal.create({ data: { nombre: 'Dirección de Obras Municipales', abreviacion: 'DOM' } });
  const unidad3 = await prisma.unidadMunicipal.create({ data: { nombre: 'Dirección de Construcciones', abreviacion: 'CONST' } });

  const tipo1 = await prisma.tipologiaProyecto.create({ data: { nombre: 'Espacio Público', abreviacion: 'EP', colorChip: '#4caf50' } });
  const tipo2 = await prisma.tipologiaProyecto.create({ data: { nombre: 'Edificación Pública', abreviacion: 'EDP', colorChip: '#2196f3' } });
  const tipo3 = await prisma.tipologiaProyecto.create({ data: { nombre: 'Infraestructura Vial', abreviacion: 'IV', colorChip: '#ff9800' } });

  const sector1 = await prisma.sector.create({ data: { nombre: 'Centro' } });
  const sector2 = await prisma.sector.create({ data: { nombre: 'Norte' } });
  const sector3 = await prisma.sector.create({ data: { nombre: 'Sur Poniente' } });

  const linea1 = await prisma.lineaFinanciamiento.create({ data: { nombre: 'FNDR' } });
  const linea2 = await prisma.lineaFinanciamiento.create({ data: { nombre: 'SUBDERE PMU' } });
  const linea3 = await prisma.lineaFinanciamiento.create({ data: { nombre: 'MINVU DS27' } });

  const prog1 = await prisma.programa.create({ data: { nombre: 'Inversión Regional', lineaFinanciamientoId: linea1.id } });
  const prog2 = await prisma.programa.create({ data: { nombre: 'Mejoramiento Urbano Emergencia', lineaFinanciamientoId: linea2.id } });
  const prog3 = await prisma.programa.create({ data: { nombre: 'Pavimentos Participativos', lineaFinanciamientoId: linea3.id } });

  const etapa1 = await prisma.etapaFinanciamiento.create({ data: { nombre: 'RS (Recomendado)' } });
  const etapa2 = await prisma.etapaFinanciamiento.create({ data: { nombre: 'Admisible' } });
  const etapa3 = await prisma.etapaFinanciamiento.create({ data: { nombre: 'Convenio Mandato' } });
  const etapa4 = await prisma.etapaFinanciamiento.create({ data: { nombre: 'Licitación' } });
  console.log('Lookup Tables seeded.');

  // --- Seed Etiquetas ---
  console.log('Seeding Etiquetas...');
  const etiquetaArq = await prisma.etiqueta.create({ data: { nombre: 'ARQUITECTO', color: '#f44336' } });
  const etiquetaProy = await prisma.etiqueta.create({ data: { nombre: 'PROYECTISTA', color: '#9c27b0' } });
  const etiquetaForm = await prisma.etiqueta.create({ data: { nombre: 'FORMULADOR', color: '#3f51b5' } });
  const etiquetaCoord = await prisma.etiqueta.create({ data: { nombre: 'COORDINADOR', color: '#009688' } });
  console.log('Etiquetas seeded.');

  // --- Seed Users ---
  console.log('Seeding Users...');
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@concepcion.cl',
      password: hashedPasswordAdmin,
      name: 'Administrador Sistema',
      role: Role.ADMIN,
      isActive: true,
      etiquetas: { connect: [{ id: etiquetaCoord.id }] }
    },
  });

  const hashedPasswordCoord = await bcrypt.hash('coord123', 10);
  const coordUser = await prisma.user.create({
    data: {
      email: 'coordinador@concepcion.cl',
      password: hashedPasswordCoord,
      name: 'Coordinador Proyectos',
      role: Role.COORDINADOR,
      isActive: true,
      etiquetas: { connect: [{ id: etiquetaCoord.id }, {id: etiquetaForm.id}] }
    },
  });

    const hashedPasswordUser = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: 'usuario@concepcion.cl',
        password: hashedPasswordUser,
        name: 'Usuario Proyectista',
        role: Role.USUARIO,
        isActive: true,
        etiquetas: { connect: [{ id: etiquetaArq.id }, { id: etiquetaProy.id }] }
      },
    });
    console.log(`Seeded Users: ${adminUser.email}, ${coordUser.email}, ${regularUser.email}`);

  // --- Seed Projects ---
  console.log('Seeding Projects...');
  // Project 1 (Assigned to regularUser)
  const codigoP1 = `${tipo1.abreviacion}-001`;
  await prisma.project.create({
    data: {
      codigoUnico: codigoP1,
      nombre: 'Mejoramiento Plaza Perú',
      descripcion: 'Remodelación integral de la plaza central, incluyendo áreas verdes, mobiliario urbano y luminarias.',
      direccion: 'Plaza Perú S/N, Concepción',
      superficieTerreno: 5000,
      superficieEdificacion: null,
      ano: 2024,
      proyectoPriorizado: true,
      estado: { connect: { id: estado3.id } }, // Diseño
      unidad: { connect: { id: unidad1.id } }, // SECPLAN
      tipologia: { connect: { id: tipo1.id } }, // Espacio Público
      sector: { connect: { id: sector1.id } }, // Centro
      proyectista: { connect: { id: regularUser.id } }, // Asignado al usuario 'USUARIO'
      formulador: { connect: { id: coordUser.id } },
      colaboradores: { connect: [{ id: adminUser.id }] }, // Admin colabora
      lineaFinanciamiento: { connect: { id: linea2.id } }, // SUBDERE PMU
      programa: { connect: { id: prog2.id } },
      etapaActualFinanciamiento: { connect: { id: etapa2.id } }, // Admisible
      // CORREGIDO: Usar Prisma.Decimal con 'P' mayúscula
      monto: new Prisma.Decimal('85000000.00'),
      tipoMoneda: TipoMoneda.CLP,
      codigoExpediente: 'EXP-PMU-2024-101',
      fechaPostulacion: new Date('2024-03-15'),
    },
  });
  console.log(`Seeded Project: ${codigoP1}`);

  // Project 2 (Unassigned Proyectista initially)
  const codigoP2 = `${tipo2.abreviacion}-001`;
    await prisma.project.create({
      data: {
        codigoUnico: codigoP2,
        nombre: 'Construcción Sede Vecinal Lorenzo Arenas',
        descripcion: 'Nueva edificación para la junta de vecinos del sector.',
        direccion: 'Calle Falsa 123, Lorenzo Arenas',
        superficieTerreno: 800,
        superficieEdificacion: 250,
        ano: 2023,
        proyectoPriorizado: false,
        estado: { connect: { id: estado4.id } }, // Ejecución
        unidad: { connect: { id: unidad3.id } }, // Construcciones
        tipologia: { connect: { id: tipo2.id } }, // Edificación Pública
        sector: { connect: { id: sector3.id } }, // Sur Poniente
        proyectista: undefined, // Sin asignar aún (o no incluir la propiedad)
        formulador: { connect: { id: coordUser.id } },
        // Sin colaboradores
        lineaFinanciamiento: { connect: { id: linea1.id } }, // FNDR
        programa: { connect: { id: prog1.id } },
        etapaActualFinanciamiento: { connect: { id: etapa3.id } }, // Convenio Mandato
        // CORREGIDO: Usar Prisma.Decimal
        monto: new Prisma.Decimal('120000000'),
        tipoMoneda: TipoMoneda.CLP,
        // CORREGIDO: Usar Prisma.Decimal
        montoAdjudicado: new Prisma.Decimal('115500000.50'),
        codigoLicitacion: 'LIC-FNDR-2023-05',
      },
    });
    console.log(`Seeded Project: ${codigoP2}`);
    console.log('Projects seeded.');

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error("Error during seeding:", e); // Loguea el error específico
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
  });