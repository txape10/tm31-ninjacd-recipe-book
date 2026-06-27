-- Paso 1: añadir user_id a las tres tablas (nullable para permitir backfill)
ALTER TABLE recipes ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE recipe_ratings ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE recipe_favorites ADD COLUMN user_id TEXT REFERENCES users(id);

-- Paso 2: backfill — mapear email → user_id desde la tabla users
UPDATE recipes
   SET user_id = (SELECT id FROM users WHERE email = recipes.created_by)
 WHERE user_id IS NULL;

UPDATE recipe_ratings
   SET user_id = (SELECT id FROM users WHERE email = recipe_ratings.user_email)
 WHERE user_id IS NULL;

UPDATE recipe_favorites
   SET user_id = (SELECT id FROM users WHERE email = recipe_favorites.user_email)
 WHERE user_id IS NULL;
