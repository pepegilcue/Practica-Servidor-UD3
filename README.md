# Practica de prestamos de material informatico

## Requisitos
- Node.js 24
- Docker

## Instalacion
1. Copiar el archivo .env.example a .env y poner un usuario y una contrasena.
2. Instalar dependencias: npm install
3. Arrancar la base de datos: docker compose up -d
4. Arrancar la aplicacion: npm start

La pagina esta en http://localhost:3000/equipos

La base de datos se crea sola con el archivo init.sql la primera vez.

## Rutas
- GET /equipos : lista de equipos con filtros y paginas
- GET /equipos/:id : detalle de un equipo
- POST /api/equipos : crear equipo
- PUT /api/equipos/:id : modificar equipo
- DELETE /api/equipos/:id : borrar equipo
- POST /api/prestamos : hacer un prestamo (equipoId, usuarioId)
- POST /api/prestamos/:id/devolucion : devolver un equipo

## Datos iniciales
11 equipos y 3 usuarios (ids 1, 2 y 3), incluidos en init.sql.

## Pruebas
| Prueba | Esperado | Obtenido |
|---|---|---|
| Crear equipo | 201 | |
| Crear con codigo repetido | 409 | |
| Modificar equipo | 200 | |
| Borrar equipo sin prestamos | 204 | |
| Borrar equipo que no existe | 404 | |
| Borrar equipo con prestamos | 409 | |
| Prestamo correcto | 201 | |
| Prestar un equipo ya prestado | 409 | |
| Prestar a un usuario que no existe | 404, el equipo sigue disponible | |
| Devolver un equipo | 200 | |
| Devolver otra vez | 409 | |
| Filtros y paginas en /equipos | Funcionan | |

## Limitaciones
- No he podido probar todo.
- La pagina es muy basica, sin estilos.
- No hay tests automaticos.