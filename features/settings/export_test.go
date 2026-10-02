package settings

import (
	"strings"
	"testing"
)

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		title  string
		noteID int
		want   string
	}{
		{title: "", noteID: 7, want: "note-7"},
		{title: "Meeting Notes", noteID: 1, want: "Meeting-Notes"},
		{title: "a/b", noteID: 1, want: "a-b"},
		{title: "a\\b", noteID: 1, want: "a-b"},
		{title: "../../etc/passwd", noteID: 1, want: "..-..-etc-passwd"},
		{title: "  spaced  out  ", noteID: 1, want: "spaced-out"},
		{title: "///", noteID: 3, want: "note-3"},
		{title: "Q3: plan?", noteID: 1, want: "Q3-plan"},
		{title: "v1.2_final", noteID: 1, want: "v1.2_final"},
	}

	for _, test := range tests {
		got := sanitizeFilename(test.title, test.noteID)
		if got != test.want {
			t.Errorf("sanitizeFilename(%q, %d) = %q, want %q", test.title, test.noteID, got, test.want)
		}
	}
}

func TestSanitizeFilenameHasNoPathSeparators(t *testing.T) {
	titles := []string{"a/b/c", "a\\b", "../x", "日本語/ノート", strings.Repeat("x/", 80)}

	for _, title := range titles {
		got := sanitizeFilename(title, 1)
		if strings.ContainsAny(got, "/\\") {
			t.Errorf("sanitizeFilename(%q) = %q, contains a path separator", title, got)
		}
		if len(got) > 100 {
			t.Errorf("sanitizeFilename(%q) = %q, longer than 100 bytes", title, got)
		}
	}
}
