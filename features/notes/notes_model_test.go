package notes

import (
	"reflect"
	"strings"
	"testing"
	"zen/commons/auth"
)

func TestBuildReadableNotesPredicate(t *testing.T) {
	tests := []struct {
		name          string
		access        auth.Access
		wantPredicate string
		wantArgs      []interface{}
	}{
		{
			name:          "unrestricted",
			access:        auth.Unrestricted,
			wantPredicate: "",
			wantArgs:      nil,
		},
		{
			name:          "no readable tags",
			access:        auth.Access{ReadTagIDs: []int{}},
			wantPredicate: "AND EXISTS (SELECT 1 FROM note_tags scoped_nt WHERE scoped_nt.note_id = n.note_id AND 0)",
			wantArgs:      nil,
		},
		{
			name:          "two tags",
			access:        auth.Access{ReadTagIDs: []int{5, 9}},
			wantPredicate: "AND EXISTS (SELECT 1 FROM note_tags scoped_nt WHERE scoped_nt.note_id = n.note_id AND scoped_nt.tag_id IN (?,?))",
			wantArgs:      []interface{}{5, 9},
		},
	}

	for _, test := range tests {
		predicate, args := buildReadableNotesPredicate(test.access)

		if predicate != test.wantPredicate {
			t.Errorf("%s: predicate = %q, want %q", test.name, predicate, test.wantPredicate)
		}

		if !reflect.DeepEqual(args, test.wantArgs) {
			t.Errorf("%s: args = %v, want %v", test.name, args, test.wantArgs)
		}

		placeholderCount := strings.Count(predicate, "?")
		if placeholderCount != len(args) {
			t.Errorf("%s: %d placeholders but %d args", test.name, placeholderCount, len(args))
		}
	}
}
