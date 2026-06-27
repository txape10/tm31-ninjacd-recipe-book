-- Recrear recipe_ratings con PK (recipe_id, user_id) en vez de (recipe_id, user_email)
CREATE TABLE recipe_ratings_new (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  rating    REAL NOT NULL CHECK(rating >= 1 AND rating <= 5),
  created_at TEXT NOT NULL,
  PRIMARY KEY (recipe_id, user_id)
);

INSERT INTO recipe_ratings_new (recipe_id, user_id, rating, created_at)
SELECT recipe_id, user_id, rating, created_at
  FROM recipe_ratings
 WHERE user_id IS NOT NULL;

DROP TABLE recipe_ratings;
ALTER TABLE recipe_ratings_new RENAME TO recipe_ratings;

-- Recrear recipe_favorites con PK (recipe_id, user_id) en vez de (recipe_id, user_email)
CREATE TABLE recipe_favorites_new (
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (recipe_id, user_id)
);

INSERT INTO recipe_favorites_new (recipe_id, user_id, created_at)
SELECT recipe_id, user_id, created_at
  FROM recipe_favorites
 WHERE user_id IS NOT NULL;

DROP TABLE recipe_favorites;
ALTER TABLE recipe_favorites_new RENAME TO recipe_favorites;
