package main

import (
	"fmt"
	"log"
)

const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Purple = "\033[35m"
	Cyan   = "\033[36m"
	White  = "\033[37m"

	Bold = "\033[1m"
)

type dbHandle struct{}

func (d *dbHandle) Close() error { return nil }

func openDatabase() (*dbHandle, error) {
	return &dbHandle{}, nil
}

func main() {
	db, err := openDatabase()
	if err != nil {
		fmt.Println(Red+"[ERROR]", Reset, "Failed to connect to Database")
		log.Fatal(err)
	}
	defer db.Close()
	fmt.Println(Green+"[OK]", Reset, "Connected to SQLite database.")

}
