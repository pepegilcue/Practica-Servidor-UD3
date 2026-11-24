import { pool } from "./db.mjs";

export class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export async function prestar(equipoId, usuarioId) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    // 1. Actualización condicional: solo si está disponible
    const upd = await cliente.query(
      "UPDATE equipos SET disponible = false WHERE id = $1 AND disponible = true",
      [equipoId]
    );
    if (upd.rowCount === 0) {
      const existe = await cliente.query("SELECT 1 FROM equipos WHERE id = $1", [equipoId]);
      await cliente.query("ROLLBACK");
      if (existe.rowCount === 0) throw new ErrorHttp(404, "El equipo no existe");
      throw new ErrorHttp(409, "El equipo no está disponible");
    }

    // 2. Insertar el préstamo
    const ins = await cliente.query(
      "INSERT INTO prestamos (equipo_id, usuario_id) VALUES ($1, $2) RETURNING *",
      [equipoId, usuarioId]
    );

    await cliente.query("COMMIT");
    return ins.rows[0];
  } catch (err) {
    await cliente.query("ROLLBACK").catch(() => {});
    if (err instanceof ErrorHttp) throw err;
    if (err.code === "23503") throw new ErrorHttp(404, "El usuario no existe");
    if (err.code === "23505") throw new ErrorHttp(409, "El equipo ya tiene un préstamo activo");
    throw err;
  } finally {
    cliente.release();
  }
}

export async function devolver(prestamoId) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    const upd = await cliente.query(
      `UPDATE prestamos SET fecha_devolucion = now()
        WHERE id = $1 AND fecha_devolucion IS NULL RETURNING *`,
      [prestamoId]
    );
    if (upd.rowCount === 0) {
      const existe = await cliente.query("SELECT 1 FROM prestamos WHERE id = $1", [prestamoId]);
      await cliente.query("ROLLBACK");
      if (existe.rowCount === 0) throw new ErrorHttp(404, "El préstamo no existe");
      throw new ErrorHttp(409, "El préstamo ya fue devuelto");
    }

    await cliente.query("UPDATE equipos SET disponible = true WHERE id = $1", [
      upd.rows[0].equipo_id
    ]);

    await cliente.query("COMMIT");
    return upd.rows[0];
  } catch (err) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}
