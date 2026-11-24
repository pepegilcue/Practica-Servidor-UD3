CREATE SCHEMA IF NOT EXISTS practica_prestamos;
SET search_path TO practica_prestamos;

CREATE TABLE equipos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE CHECK (char_length(codigo) BETWEEN 1 AND 20),
  nombre TEXT NOT NULL CHECK (btrim(nombre) <> ''),
  categoria TEXT NOT NULL CHECK (btrim(categoria) <> ''),
  disponible BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE usuarios (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE prestamos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha_prestamo TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_devolucion TIMESTAMPTZ NULL
);

-- Solo un préstamo activo por equipo
CREATE UNIQUE INDEX prestamo_activo_unico
  ON prestamos (equipo_id) WHERE fecha_devolucion IS NULL;

INSERT INTO equipos (codigo, nombre, categoria) VALUES
  ('POR-001', 'Portátil Lenovo ThinkPad', 'Portátil'),
  ('POR-002', 'Portátil HP ProBook', 'Portátil'),
  ('POR-003', 'Portátil Dell Latitude', 'Portátil'),
  ('TAB-001', 'Tableta Samsung Galaxy Tab', 'Tableta'),
  ('TAB-002', 'iPad 10.ª generación', 'Tableta'),
  ('PRO-001', 'Proyector Epson EB-X49', 'Proyector'),
  ('PRO-002', 'Proyector BenQ MX550', 'Proyector'),
  ('CAM-001', 'Cámara web Logitech C920', 'Accesorio'),
  ('RAT-001', 'Ratón inalámbrico', 'Accesorio'),
  ('MIC-001', 'Micrófono USB Blue Yeti', 'Audio'),
  ('ALT-001', 'Altavoces portátiles JBL', 'Audio');

INSERT INTO usuarios (nombre) VALUES ('Ana López'), ('Luis Pérez'), ('Marta Ruiz');
