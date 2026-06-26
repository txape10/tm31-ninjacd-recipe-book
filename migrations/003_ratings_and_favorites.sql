CREATE TABLE IF NOT EXISTS recipe_ratings (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  rating REAL NOT NULL CHECK (rating >= 1 AND rating <= 5 AND rating % 0.5 = 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (recipe_id, user_email)
);

CREATE TABLE IF NOT EXISTS recipe_favorites (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (recipe_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_email);
