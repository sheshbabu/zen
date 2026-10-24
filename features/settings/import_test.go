package settings

import (
	"reflect"
	"testing"
	"time"
)

func TestExtractFrontmatter(t *testing.T) {
	created := time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC)
	updated := time.Date(2026, 2, 3, 4, 5, 6, 0, time.UTC)

	tests := []struct {
		name      string
		content   string
		wantBody  string
		wantTitle string
		wantTags  []string
		wantDates bool
	}{
		{
			name:     "no frontmatter",
			content:  "Just a note",
			wantBody: "Just a note",
		},
		{
			name:     "unterminated frontmatter",
			content:  "---\ntitle: Open\nbody",
			wantBody: "---\ntitle: Open\nbody",
		},
		{
			name:      "all keys",
			content:   "---\ntitle: My Note\ntags: work, ideas\ncreated: 2026-01-02T03:04:05Z\nupdated: 2026-02-03T04:05:06Z\n---\n\nBody text",
			wantBody:  "Body text",
			wantTitle: "My Note",
			wantTags:  []string{"work", "ideas"},
			wantDates: true,
		},
		{
			name:      "CRLF line endings",
			content:   "---\r\ntitle: Windows\r\n---\r\nBody\r\nline two",
			wantBody:  "Body\nline two",
			wantTitle: "Windows",
		},
		{
			name:      "title containing a colon",
			content:   "---\ntitle: Re: meeting\n---\nBody",
			wantBody:  "Body",
			wantTitle: "Re: meeting",
		},
		{
			name:     "empty tags",
			content:  "---\ntags:\n---\nBody",
			wantBody: "Body",
		},
		{
			name:      "first value wins",
			content:   "---\ntitle: First\ntitle: Second\n---\nBody",
			wantBody:  "Body",
			wantTitle: "First",
		},
		{
			name:     "invalid date is ignored",
			content:  "---\ncreated: yesterday\n---\nBody",
			wantBody: "Body",
		},
	}

	for _, test := range tests {
		body, fm := extractFrontmatter(test.content)

		if body != test.wantBody {
			t.Errorf("%s: body = %q, want %q", test.name, body, test.wantBody)
		}

		if fm.title != test.wantTitle {
			t.Errorf("%s: title = %q, want %q", test.name, fm.title, test.wantTitle)
		}

		if !reflect.DeepEqual(fm.tags, test.wantTags) {
			t.Errorf("%s: tags = %#v, want %#v", test.name, fm.tags, test.wantTags)
		}

		if test.wantDates {
			if fm.createdAt == nil || !fm.createdAt.Equal(created) {
				t.Errorf("%s: createdAt = %v, want %v", test.name, fm.createdAt, created)
			}
			if fm.updatedAt == nil || !fm.updatedAt.Equal(updated) {
				t.Errorf("%s: updatedAt = %v, want %v", test.name, fm.updatedAt, updated)
			}
		} else if fm.createdAt != nil || fm.updatedAt != nil {
			t.Errorf("%s: dates = %v, %v, want none", test.name, fm.createdAt, fm.updatedAt)
		}
	}
}

func TestSplitTags(t *testing.T) {
	tests := []struct {
		value string
		want  []string
	}{
		{value: "", want: nil},
		{value: "work", want: []string{"work"}},
		{value: "work, ideas", want: []string{"work", "ideas"}},
		{value: " work ,, ideas , ", want: []string{"work", "ideas"}},
		{value: "multi word tag, other", want: []string{"multi word tag", "other"}},
	}

	for _, test := range tests {
		got := splitTags(test.value)
		if !reflect.DeepEqual(got, test.want) {
			t.Errorf("splitTags(%q) = %#v, want %#v", test.value, got, test.want)
		}
	}
}

func TestExtractTagNamesFromPath(t *testing.T) {
	tests := []struct {
		path string
		want []string
	}{
		{path: "", want: nil},
		{path: "note.md", want: nil},
		{path: "work/note.md", want: []string{"work"}},
		{path: "export/work/projects/note.md", want: []string{"projects"}},
		{path: "/work/note.md", want: []string{"work"}},
		{path: "work//note.md", want: []string{"work"}},
	}

	for _, test := range tests {
		got := extractTagNamesFromPath(test.path)
		if !reflect.DeepEqual(got, test.want) {
			t.Errorf("extractTagNamesFromPath(%q) = %#v, want %#v", test.path, got, test.want)
		}
	}
}
