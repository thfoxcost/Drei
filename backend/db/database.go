package database

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func Open() (*sql.DB, error) {
	if err := os.MkdirAll("data", 0755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join("data", "app.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)

	return db, nil
}
