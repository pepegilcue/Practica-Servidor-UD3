
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as repo from "./equipos.repo.mjs";
import { POR_PAGINA } from "./equipos.repo.mjs";
import { prestar, devolver, ErrorHttp } from "./prestamos.service.mjs";

const app = express();
const dir = path.dirname(fileURLToPath(import.meta.url));

// ---------- Configuración ----------
app.set("view engine", "ejs");
app.set("views", path.join(dir, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Página principal ----------
app.get("/", (req, res) => {
  res.redirect("/equipos");
});

// ---------- Validación ----------
function idPositivo(valor) {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) ? n : null;
}

function enteroPositivoJson(valor) {
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

function validarEquipo(body) {
  const { codigo, nombre, categoria } = body ?? {};

  if (
    typeof codigo !== "string" ||
    codigo.trim().length < 1 ||
    codigo.length > 20
  ) {
    throw new ErrorHttp(400, "codigo debe tener entre 1 y 20 caracteres");
  }

  if (typeof nombre !== "string" || nombre.trim() === "") {
    throw new ErrorHttp(400, "nombre es obligatorio");
  }

  if (typeof categoria !== "string" || categoria.trim() === "") {
    throw new ErrorHttp(400, "categoria es obligatoria");
  }

  return {
    codigo: codigo.trim(),
    nombre: nombre.trim(),
    categoria: categoria.trim()
  };
}

// ---------- Vistas ----------

app.get("/equipos", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const categoria =
    typeof req.query.categoria === "string" ? req.query.categoria : "";

  const disponible =
    typeof req.query.disponible === "string" ? req.query.disponible : "";

  const orden = req.query.orden === "nombre" ? "nombre" : "codigo";

  const paginaNum = Number(req.query.pagina);
  const pagina =
    Number.isInteger(paginaNum) && paginaNum > 0 ? paginaNum : 1;

  const { filas, total } = await repo.listar({
    q,
    categoria,
    disponible,
    orden,
    pagina
  });

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const categorias = await repo.categorias();

  res.render("equipos", {
    equipos: filas,
    categorias,
    total,
    pagina,
    totalPaginas,
    filtros: {
      q,
      categoria,
      disponible,
      orden
    }
  });
});

app.get("/equipos/:id", async (req, res) => {
  const id = idPositivo(req.params.id);

  if (id === null) {
    return res.status(400).send("Identificador no válido");
  }

  const datos = await repo.detalle(id);

  if (!datos) {
    return res.status(404).send("Equipo no encontrado");
  }

  res.render("equipo", datos);
});

// ---------- API equipos ----------

app.post("/api/equipos", async (req, res) => {
  const datos = validarEquipo(req.body);

  const equipo = await repo.crear(datos);

  res.status(201)
    .location(`/api/equipos/${equipo.id}`)
    .json(equipo);
});

app.put("/api/equipos/:id", async (req, res) => {
  const id = idPositivo(req.params.id);

  if (id === null) {
    throw new ErrorHttp(400, "Identificador no válido");
  }

  const datos = validarEquipo(req.body);
  const equipo = await repo.actualizar(id, datos);

  if (!equipo) {
    throw new ErrorHttp(404, "Equipo no encontrado");
  }

  res.json(equipo);
});

app.delete("/api/equipos/:id", async (req, res) => {
  const id = idPositivo(req.params.id);

  if (id === null) {
    throw new ErrorHttp(400, "Identificador no válido");
  }

  const borrado = await repo.borrar(id);

  if (!borrado) {
    throw new ErrorHttp(404, "Equipo no encontrado");
  }

  res.status(204).end();
});

// ---------- API préstamos ----------

app.post("/api/prestamos", async (req, res) => {
  const equipoId = enteroPositivoJson(req.body?.equipoId);
  const usuarioId = enteroPositivoJson(req.body?.usuarioId);

  if (equipoId === null || usuarioId === null) {
    throw new ErrorHttp(
      400,
      "equipoId y usuarioId deben ser enteros positivos"
    );
  }

  const prestamo = await prestar(equipoId, usuarioId);

  res.status(201).json(prestamo);
});

app.post("/api/prestamos/:id/devolucion", async (req, res) => {
  const id = idPositivo(req.params.id);

  if (id === null) {
    throw new ErrorHttp(400, "Identificador no válido");
  }

  res.json(await devolver(id));
});

// ---------- Errores ----------

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ErrorHttp) {
    return res.status(err.estado).json({
      error: err.message
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "JSON mal formado"
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      error: "El código ya existe"
    });
  }

  if (err.code === "23503") {
    return res.status(409).json({
      error: "El equipo tiene préstamos registrados"
    });
  }

  console.error("Error interno:", err.message);

  res.status(500).json({
    error: "Error interno del servidor"
  });
});

// ---------- Iniciar servidor ----------

const puerto = Number(process.env.PORT) || 3001;

app.listen(puerto, () => {
  console.log(`Servidor en http://localhost:${puerto}`);
});
