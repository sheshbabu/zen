package sqlite

import "testing"

func TestParseMigrationVersion(t *testing.T) {
	tests := []struct {
		name        string
		want        int
		shouldError bool
	}{
		{name: "1_init.sql", want: 1},
		{name: "10_canvases.sql", want: 10},
		{name: "13_api_tokens.sql", want: 13},
		{name: "007_padded.sql", want: 7},
		{name: "init.sql", shouldError: true},
		{name: "_init.sql", shouldError: true},
		{name: "v2_init.sql", shouldError: true},
	}

	for _, test := range tests {
		got, err := parseMigrationVersion(test.name)

		if test.shouldError {
			if err == nil {
				t.Errorf("parseMigrationVersion(%q) = %d, want an error", test.name, got)
			}
			continue
		}

		if err != nil {
			t.Errorf("parseMigrationVersion(%q) returned error: %v", test.name, err)
			continue
		}

		if got != test.want {
			t.Errorf("parseMigrationVersion(%q) = %d, want %d", test.name, got, test.want)
		}
	}
}
