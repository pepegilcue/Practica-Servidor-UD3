import { pool } from "./db.mjs";

// Ordenaciones predefinidas: nunca se concatena lo que llega en la petición
const ORDEN = { codigo: "codigo", nombre: "nombre" };
export const POR_PAGINA = 5;

export async function listar({ q, categoria, disponible, orden, pagina }) {
  const condiciones = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    condiciones.push(`nombre ILIKE $${params.length}`);
  }
  if (categoria) {
    params.push(categoria);
    condiciones.push(`categoria = $${params.length}`);
  }
  if (disponible === "true" || disponible === "false") {
    params.push(disponible === "true");
    condiciones.push(`disponible = $${params.length}`);
  }
  const where = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";
  const columna = ORDEN[orden] ?? "codigo";

  const total = await pool.query(`SELECT count(*)::int AS n FROM equipos ${where}`, params);

  const paramsPagina = [...params, POR_PAGINA, (pagina - 1) * POR_PAGINA];
  const filas = await pool.query(
    `SELECT id, codigo, nombre, categoria, disponible
       FROM equipos ${where}
      ORDER BY ${columna}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    paramsPagina
  );
  return { filas: filas.rows, total: total.rows[0].n };
}

export async function categorias() {
  const r = await pool.query("SELECT DISTINCT categoria FROM equipos ORDER BY categoria");
  return r.rows.map((f) => f.categoria);
}

export async function detalle(id) {
  // LEFT JOIN: el equipo aparece aunque no tenga préstamo activo
  const equipo = await pool.query(
    `SELECT e.id, e.codigo, e.nombre, e.categoria, e.disponible, u.nombre AS prestado_a
       FROM equipos e
       LEFT JOIN prestamos p ON p.equipo_id = e.id AND p.fecha_devolucion IS NULL
       LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE e.id = $1`,
    [id]
  );
  if (equipo.rowCount === 0) return null;
  const historial = await pool.query(
    `SELECT p.id, u.nombre AS usuario, p.fecha_prestamo, p.fecha_devolucion
       FROM prestamos p
       JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.equipo_id = $1
      ORDER BY p.fecha_prestamo DESC`,
    [id]
  );
  return { equipo: equipo.rows[0], prestamos: historial.rows };
}

export async function crear({ codigo, nombre, categoria }) {
  const r = await pool.query(
    `INSERT INTO equipos (codigo, nombre, categoria) VALUES ($1, $2, $3) RETURNING *`,
    [codigo, nombre, categoria]
  );
  return r.rows[0];
}

export async function actualizar(id, { codigo, nombre, categoria }) {
  // No se toca "disponible"
  const r = await pool.query(
    `UPDATE equipos SET codigo = $1, nombre = $2, categoria = $3 WHERE id = $4 RETURNING *`,
    [codigo, nombre, categoria, id]
  );
  return r.rowCount === 0 ? null : r.rows[0];
}

export async function borrar(id) {
  const r = await pool.query("DELETE FROM equipos WHERE id = $1", [id]);
  return r.rowCount > 0;
}
