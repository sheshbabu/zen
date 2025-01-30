package sqlite

import (
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strconv"
	"strings"
)

type migration struct {
	version   int
	name      string
	content   string
	isApplied bool
}

func Migrate(resources embed.FS) {
	createMigrationsTable()

	migrations := getAllMigrations(resources)

	migrations = getUnAppliedMigrations(migrations)

	if len(migrations) > 0 {
		slog.Info("applying database migrations")
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].version < migrations[j].version
	})

	applyMigrations(migrations)
}

func createMigrationsTable() {
	query := "CREATE TABLE IF NOT EXISTS migrations (version INT)"

	_, err := DB.Exec(query)

	if err != nil {
		err = fmt.Errorf("error creating migrations table: %w", err)
		panic(err)
	}
}

func getAllMigrations(resources embed.FS) []migration {
	var migrations []migration

	fs.WalkDir(resources, ".", func(path string, d fs.DirEntry, err error) error {
		if strings.Contains(d.Name(), ".sql") {
			migrations = append(migrations, getMigration(resources, path, d.Name()))
		}
		return nil
	})

	return migrations
}

func getMigration(resources embed.FS, path string, name string) migration {
	content, err := fs.ReadFile(resources, path)

	if err != nil {
		err = fmt.Errorf("error reading migration file: %w", err)
		panic(err)
	}

	version, err := strconv.Atoi(strings.Split(name, "_")[0])

	if err != nil {
		err = fmt.Errorf("error parsing migration file version: %w", err)
		panic(err)
	}

	return migration{
		name:      name,
		version:   version,
		content:   string(content),
		isApplied: false,
	}
}

func getUnAppliedMigrations(migrations []migration) []migration {
	query := "SELECT version FROM migrations ORDER BY version ASC"

	rows, err := DB.Query(query)
	defer rows.Close()

	if err != nil {
		err = fmt.Errorf("error retrieving migrations: %w", err)
		panic(err)
	}

	for rows.Next() {
		var version int
		err = rows.Scan(&version)

		if err != nil {
			err = fmt.Errorf("error scanning migration record: %w", err)
			panic(err)
		}

		for i := range migrations {
			if migrations[i].version == version {
				migrations[i].isApplied = true
			}
		}
	}

	var unAppliedMigrations []migration
	for i := range migrations {
		if !migrations[i].isApplied {
			unAppliedMigrations = append(unAppliedMigrations, migrations[i])
		}
	}

	return unAppliedMigrations
}

func applyMigrations(migrations []migration) {
	tx, err := DB.Begin()

	if err != nil {
		err = fmt.Errorf("error beginning migration tx: %w", err)
		panic(err)
	}

	for _, m := range migrations {
		slog.Info("applying migration", "name", m.name)
		_, err = tx.Exec(m.content)

		if err != nil {
			err = fmt.Errorf("error applying migration %d: %w", m.version, err)
			slog.Error(err.Error())

			err = tx.Rollback()
			if err != nil {
				err = fmt.Errorf("error rolling back migration: %w", err)
				panic(err)
			}

			return
		}

		query := "INSERT INTO migrations VALUES(?)"
		_, err = tx.Exec(query, m.version)

		if err != nil {
			err = fmt.Errorf("error updating migrations table %d: %w", m.version, err)
			slog.Error(err.Error())

			err = tx.Rollback()
			if err != nil {
				err = fmt.Errorf("error rolling back migration: %w", err)
				panic(err)
			}

			return
		}
	}

	err = tx.Commit()

	if err != nil {
		err = fmt.Errorf("error commiting migrations: %w", err)
		slog.Error(err.Error())

		err = tx.Rollback()
		if err != nil {
			err = fmt.Errorf("error rolling back migration: %w", err)
			panic(err)
		}

		return
	}
}
