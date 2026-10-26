-- En körning: fyra tjänster gånger två frågor, analysen och läsbarhetskontrollen.
CREATE TABLE korning (
  id TEXT PRIMARY KEY,
  skapad TEXT NOT NULL DEFAULT (datetime('now')),
  foretag TEXT NOT NULL,
  bransch TEXT NOT NULL,
  ort TEXT NOT NULL,
  hemsida TEXT,
  modeller_json TEXT NOT NULL,
  svar_json TEXT,
  kallor_json TEXT,
  analys_json TEXT,
  las_json TEXT,
  ip_hash TEXT NOT NULL
);

CREATE INDEX korning_skapad ON korning (skapad);
CREATE INDEX korning_sokning ON korning (foretag, bransch, ort, skapad);
CREATE INDEX korning_ip ON korning (ip_hash, skapad);

-- Dygnsbudgeten i kronor. Taket står i en konstant i koden.
CREATE TABLE budget (
  dag TEXT PRIMARY KEY,
  kronor REAL NOT NULL DEFAULT 0
);
