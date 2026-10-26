-- Antal modellanrop per körning: åtta svar, analysen och några nya försök.
-- Taket står i koden och hindrar att samma körning anropas om och om igen.
ALTER TABLE korning ADD COLUMN anrop INTEGER NOT NULL DEFAULT 0;
