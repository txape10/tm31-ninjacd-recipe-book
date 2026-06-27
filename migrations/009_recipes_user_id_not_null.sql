-- Añadir user_id NOT NULL a recipes mediante recreación de tabla
-- (SQLite no permite ALTER COLUMN para cambiar nullabilidad)

-- Guardar todas las dependencias (tags, steps, ingredient_groups) tienen ON DELETE CASCADE,
-- así que borramos recipes_new al final sin tocarlas

PRAGMA foreign_keys = OFF;

CREATE TABLE recipes_new (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  section              TEXT NOT NULL,
  appliance            TEXT NOT NULL,
  program              TEXT NOT NULL,
  difficulty           TEXT NOT NULL,
  calories_per_serving INTEGER,
  cover_image_url      TEXT,
  source               TEXT,
  notes                TEXT,
  has_mixin            INTEGER NOT NULL DEFAULT 0,
  is_public            INTEGER NOT NULL DEFAULT 1,
  user_id              TEXT NOT NULL REFERENCES users(id),
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

INSERT INTO recipes_new
  SELECT id, title, slug, section, appliance, program, difficulty,
         calories_per_serving, cover_image_url, source, notes,
         has_mixin, is_public, user_id, created_at, updated_at
    FROM recipes
   WHERE user_id IS NOT NULL;

DROP TABLE recipes;
ALTER TABLE recipes_new RENAME TO recipes;

PRAGMA foreign_keys = ON;
